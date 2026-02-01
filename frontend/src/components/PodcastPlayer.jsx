/**
 * PodcastPlayer — custom play/pause/seek + Web Audio visualization (amplitude/tempo).
 * Hidden <audio>; AnalyserNode drives a canvas that reacts to frequency data with smooth animation.
 */
import { useRef, useEffect, useState, useCallback } from 'react'

const FFT_SIZE = 256
const SMOOTHING = 0.8
const LERP = 0.25
const BAR_COUNT = 32

function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function PodcastPlayer({ audioUrl, className = '' }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const contextRef = useRef(null)
  const sourceRef = useRef(null)
  const rafRef = useRef(null)
  const barHeightsRef = useRef(new Float32Array(BAR_COUNT))

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [contextReady, setContextReady] = useState(false)

  const initAudioContext = useCallback(() => {
    const audio = audioRef.current
    if (!audio || contextRef.current) {
      if (contextRef.current) setContextReady(true)
      return
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = SMOOTHING
      source.connect(analyser)
      analyser.connect(ctx.destination)
      contextRef.current = ctx
      sourceRef.current = source
      analyserRef.current = analyser
      setContextReady(true)
    } catch (e) {
      console.warn('Web Audio not available:', e)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const onLoadedMetadata = () => setDuration(audio.duration)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audioUrl])

  useEffect(() => {
    if (!audioUrl) return
    const audio = audioRef.current
    if (audio) {
      audio.src = audioUrl
      setDuration(0)
      setCurrentTime(0)
    }
  }, [audioUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const barHeights = barHeightsRef.current
    const w = canvas.width
    const h = canvas.height
    const barWidth = w / BAR_COUNT
    const gap = Math.max(1, Math.floor(barWidth * 0.2))

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const step = Math.floor(bufferLength / BAR_COUNT)
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) sum += dataArray[i * step + j]
        const raw = step > 0 ? sum / step : 0
        const target = (raw / 255) * h * 0.6
        barHeights[i] = barHeights[i] + (target - barHeights[i]) * LERP
      }

      ctx.fillStyle = 'rgba(255, 248, 240, 0.15)'
      ctx.fillRect(0, 0, w, h)

      const gradient = ctx.createLinearGradient(0, h, 0, 0)
      gradient.addColorStop(0, '#FFD56B')
      gradient.addColorStop(0.5, '#FFB84D')
      gradient.addColorStop(1, '#E8A030')
      ctx.fillStyle = gradient

      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * barWidth + gap / 2
        const height = Math.max(4, barHeights[i])
        const y = h - height
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth - gap, height, 4)
        ctx.fill()
      }
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [contextReady])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    initAudioContext()
    if (contextRef.current?.state === 'suspended') contextRef.current.resume()
    if (audio.paused) audio.play()
    else audio.pause()
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const p = Math.max(0, Math.min(1, x / rect.width))
    audio.currentTime = p * duration
  }

  if (!audioUrl) return null

  return (
    <div className={className}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" className="hidden" />

      <div className="flex flex-col items-center gap-4">
        <div
          className="w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#FFF8F0]/80 to-[#FFFAF5]/80 border border-gray-100"
          style={{ height: 120 }}
        >
          <canvas
            ref={canvasRef}
            width={300}
            height={120}
            className="w-full h-full block"
            style={{ width: '100%', height: 120 }}
          />
        </div>

        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono text-gray-500 tabular-nums min-w-[2.5rem]">
            {formatTime(currentTime)}
          </span>
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            aria-valuenow={currentTime}
            tabIndex={0}
            className="flex-1 h-2 rounded-full bg-gray-200 cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FFB84D] to-[#E8A030] transition-all duration-100"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-500 tabular-nums min-w-[2.5rem]">
            {formatTime(duration)}
          </span>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center shadow-lg hover:bg-[#2A2A2A] active:scale-95 transition-all"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
