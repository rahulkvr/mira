/**
 * Full-page podcast player: dynamic equalizer-style visualization.
 * Click the visualization to play/pause. Shown after "Generate podcast" succeeds.
 */
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'

const FFT_SIZE = 1024
const SMOOTHING = 0.6
const BAR_COUNT = 72
const LERP = 0.38
const CANVAS_SIZE = 320

function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const HVV_LINE_COLORS = {
  U1: { bg: '#0072bc', fg: '#fff' },
  U2: { bg: '#ed1c24', fg: '#fff' },
  U3: { bg: '#ffde00', fg: '#1a1a1a' },
  U4: { bg: '#00aaad', fg: '#fff' },
  S1: { bg: '#00962c', fg: '#fff' },
  S2: { bg: '#b41439', fg: '#fff' },
  S3: { bg: '#54216e', fg: '#fff' },
  S4: { bg: '#0082c8', fg: '#fff' },
  S5: { bg: '#008abd', fg: '#fff' },
  S11: { bg: '#00962c', fg: '#fff' },
  S21: { bg: '#b41439', fg: '#fff' },
  S31: { bg: '#54216e', fg: '#fff' },
}
const BUS_COLOR = { bg: '#E30613', fg: '#fff' }
const FERRY_COLOR = { bg: '#006DB2', fg: '#fff' }
const FALLBACK_COLOR = { bg: '#6B7280', fg: '#fff' }

function getLineStyle(line) {
  if (!line) return { ...FALLBACK_COLOR, label: '—' }
  const name = (line?.name || '').trim().toUpperCase()
  const shortInfo = (line?.type?.shortInfo || '').toUpperCase()
  const simpleType = line?.type?.simpleType || ''
  const label = line?.name || shortInfo || '—'
  const exact = HVV_LINE_COLORS[name]
  if (exact) return { ...exact, label }
  if (simpleType === 'BUS' || shortInfo === 'BUS' || /^\d+$/.test((line?.name || '').trim())) {
    return { ...BUS_COLOR, label: line?.name || 'Bus' }
  }
  if (simpleType === 'SHIP' || shortInfo === 'F') {
    return { ...FERRY_COLOR, label: line?.name || 'Fähre' }
  }
  return { ...FALLBACK_COLOR, label }
}

function formatConnectionTime(depTime, arrTime) {
  if (!depTime && !arrTime) return null
  const depT = depTime?.time?.trim()
  const arrT = arrTime?.time?.trim()
  if (depT && arrT) return `${depT} – ${arrT}`
  return depT || arrT || null
}

/** Parse Geofox-style time { date: "DD.MM.YYYY" or "YYYY-MM-DD", time: "HH:mm" } to Date (local). Returns null if invalid. */
function parseGeofoxTime(t) {
  if (!t || !t.date || !t.time) return null
  const dateStr = String(t.date).trim()
  const timeStr = String(t.time).trim()
  let d, m, y
  if (dateStr.includes('.')) {
    [d, m, y] = dateStr.split('.').map(Number)
  } else if (dateStr.includes('-')) {
    const [yPart, mPart, dPart] = dateStr.split('-').map(Number)
    y = yPart
    m = mPart
    d = dPart
  } else {
    return null
  }
  const [h, min] = timeStr.split(':').map(Number)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d) || Number.isNaN(h)) return null
  const month = m >= 1 && m <= 12 ? m - 1 : 0
  const date = new Date(y, month, d, h, Number.isNaN(min) ? 0 : min, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Compute journey progress from real time and schedule departure/arrival times.
 * Returns { progress: 0..1, currentSegmentIndex: number, useRealTime: boolean }.
 */
function useJourneyProgressFromSchedule(scheduleElements, audioCurrentTime, audioDuration) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  return useMemo(() => {
    if (!Array.isArray(scheduleElements) || scheduleElements.length === 0) {
      const progress = audioDuration > 0 ? Math.min(1, audioCurrentTime / audioDuration) : 0
      const numSegments = 1
      return {
        progress,
        currentSegmentIndex: 0,
        useRealTime: false,
      }
    }

    const firstDep = parseGeofoxTime(scheduleElements[0]?.from?.depTime)
    const lastArr = parseGeofoxTime(scheduleElements[scheduleElements.length - 1]?.to?.arrTime)
    if (!firstDep || !lastArr || lastArr <= firstDep) {
      const progress = audioDuration > 0 ? Math.min(1, audioCurrentTime / audioDuration) : 0
      const numSegments = Math.max(1, scheduleElements.length)
      return {
        progress,
        currentSegmentIndex: Math.min(Math.floor(progress * numSegments), numSegments - 1),
        useRealTime: false,
      }
    }

    const journeyStartMs = firstDep.getTime()
    const journeyEndMs = lastArr.getTime()
    const totalMs = journeyEndMs - journeyStartMs
    const nowMs = now
    let progress = (nowMs - journeyStartMs) / totalMs
    if (progress < 0) progress = 0
    if (progress > 1) progress = 1

    let currentSegmentIndex = 0
    for (let i = 0; i < scheduleElements.length; i++) {
      const segStart = parseGeofoxTime(scheduleElements[i]?.from?.depTime)
      const segEnd = parseGeofoxTime(scheduleElements[i]?.to?.arrTime)
      if (!segStart || !segEnd) continue
      const startMs = segStart.getTime()
      const endMs = segEnd.getTime()
      if (nowMs >= startMs && nowMs <= endMs) {
        currentSegmentIndex = i
        break
      }
      if (nowMs < startMs) {
        currentSegmentIndex = i
        break
      }
      currentSegmentIndex = i
    }
    currentSegmentIndex = Math.min(currentSegmentIndex, scheduleElements.length - 1)

    return {
      progress,
      currentSegmentIndex,
      useRealTime: true,
    }
  }, [scheduleElements, now, audioCurrentTime, audioDuration])
}

const ANNOUNCEMENTS_POLL_MS = 60000

function getAnnouncementLabel(a) {
  if (typeof a === 'string') return a
  return a?.title ?? a?.text ?? a?.message ?? a?.headline ?? a?.description ?? a?.content ?? (typeof a === 'object' ? JSON.stringify(a).slice(0, 200) : String(a))
}

function mentionsDelay(text) {
  if (!text || typeof text !== 'string') return false
  const lower = text.toLowerCase()
  return /delay|verspätung|late|verzögerung|\d+\s*min\s*(delay|late|verspätung)/i.test(lower)
}

export function PodcastPlayerPage({
  audioUrl,
  routeSummary,
  scheduleElements = [],
  durationMinutes,
  routeStations = [],
  apiBase = '',
  onBack,
}) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const contextRef = useRef(null)
  const rafRef = useRef(null)
  const barHeightsRef = useRef(new Float32Array(BAR_COUNT))

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [contextReady, setContextReady] = useState(false)
  const autoplayTriedRef = useRef(false)
  const [announcements, setAnnouncements] = useState([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)

  const apiBaseNorm = (() => {
    const raw = (apiBase || '').trim().replace(/\/+$/, '')
    if (!raw) return ''
    return /^https?:\/\//i.test(raw) ? raw : `http://${raw}`
  })()
  const { progress: journeyProgress, currentSegmentIndex } = useJourneyProgressFromSchedule(
    scheduleElements,
    currentTime,
    duration
  )
  const delayAnnouncements = announcements.filter((a) => mentionsDelay(getAnnouncementLabel(a)))
  const hasDelays = delayAnnouncements.length > 0

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setAnnouncementsLoading(true)
      try {
        const params = new URLSearchParams()
        if (routeStations.length > 0) params.set('stations', routeStations.join(','))
        const url = `${apiBaseNorm}/api/announcements${params.toString() ? `?${params.toString()}` : ''}`.replace(/\/+/g, '/')
        const res = await fetch(url)
        const data = await res.json()
        if (data.success && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements)
        } else {
          setAnnouncements([])
        }
      } catch {
        setAnnouncements([])
      } finally {
        setAnnouncementsLoading(false)
      }
    }
    fetchAnnouncements()
    const interval = setInterval(fetchAnnouncements, ANNOUNCEMENTS_POLL_MS)
    return () => clearInterval(interval)
  }, [apiBaseNorm, routeStations.join(',')])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

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
    const onEnded = () => setCurrentTime(0)

    const onCanPlay = () => {
      if (autoplayTriedRef.current) return
      autoplayTriedRef.current = true
      initAudioContext()
      if (contextRef.current?.state === 'suspended') {
        contextRef.current.resume().then(() => audio.play().catch(() => {}))
      } else {
        audio.play().catch(() => {})
      }
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('canplay', onCanPlay)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('canplay', onCanPlay)
    }
  }, [audioUrl, initAudioContext])

  useEffect(() => {
    if (!audioUrl) return
    autoplayTriedRef.current = false
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = CANVAS_SIZE * dpr
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const barHeights = barHeightsRef.current
    const w = CANVAS_SIZE
    const h = CANVAS_SIZE
    const cx = w / 2
    const cy = h / 2
    const innerRadius = 28
    const maxBarLength = 120
    const barWidth = 3.5

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const step = Math.floor(bufferLength / BAR_COUNT)
      let avg = 0
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) sum += dataArray[i * step + j]
        const raw = step > 0 ? sum / step : 0
        avg += raw
        const target = (raw / 255) * maxBarLength
        barHeights[i] = barHeights[i] + (target - barHeights[i]) * LERP
      }
      const overallLevel = avg / (BAR_COUNT * 255)

      ctx.fillStyle = 'rgba(255, 252, 248, 0.85)'
      ctx.fillRect(0, 0, w, h)

      const pulseRadius = 16 + overallLevel * 12
      const pulseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius * 2)
      pulseGrad.addColorStop(0, 'rgba(251, 113, 133, 0.35)')
      pulseGrad.addColorStop(0.6, 'rgba(251, 113, 133, 0.08)')
      pulseGrad.addColorStop(1, 'rgba(251, 113, 133, 0)')
      ctx.fillStyle = pulseGrad
      ctx.beginPath()
      ctx.arc(cx, cy, pulseRadius * 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(251, 113, 133, 0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, innerRadius - 2, 0, Math.PI * 2)
      ctx.stroke()

      for (let i = 0; i < BAR_COUNT; i++) {
        const length = Math.max(4, barHeights[i])
        const angle = (i / BAR_COUNT) * 2 * Math.PI - Math.PI / 2
        const x0 = cx + Math.cos(angle) * innerRadius
        const y0 = cy + Math.sin(angle) * innerRadius
        const x1 = cx + Math.cos(angle) * (innerRadius + length)
        const y1 = cy + Math.sin(angle) * (innerRadius + length)

        const t = i / BAR_COUNT
        const r = Math.floor(251 - t * 80)
        const g = Math.floor(113 + t * 50)
        const b = Math.floor(133 + t * 90)
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.95)`
        ctx.lineWidth = barWidth
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
      }
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [contextReady])

  if (!audioUrl) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#FAF8F5] via-[#FFFBF7] to-[#F7F4EF]">
      {/* Header — compact for mobile */}
      <div className="shrink-0 px-4 pt-5 pb-2 sm:pt-6 sm:pb-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-600 text-sm hover:text-[#1F1F1F] transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
          <div className="flex-1 min-w-0 rounded-xl bg-white/80 border border-gray-200/80 shadow-sm px-4 py-2.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest truncate">
              {routeSummary || 'Your route'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {durationMinutes != null && (
                <span className="text-sm font-bold text-[#1F1F1F]">
                  {Math.max(1, Math.round(durationMinutes))} min
                </span>
              )}
              {scheduleElements.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {scheduleElements.slice(0, 3).map((el, i) => {
                    const style = getLineStyle(el?.line)
                    const timeRange = formatConnectionTime(el?.from?.depTime, el?.to?.arrTime)
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                        style={{ backgroundColor: style.bg, color: style.fg }}
                      >
                        {style.label}
                        {timeRange && <span className="opacity-85">{timeRange}</span>}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Circular radial visualizer — tap to play/pause, mobile-first */}
      <div className="flex-1 flex flex-col items-center min-h-0 px-4 overflow-y-auto">
        <div className="flex flex-col items-center flex-shrink-0 py-2 sm:py-4">
          <button
            type="button"
            onClick={togglePlayPause}
            className="touch-manipulation w-[min(100%,320px)] h-[min(100%,320px)] min-h-[280px] rounded-[2rem] overflow-hidden bg-gradient-to-br from-white to-gray-50/90 border border-gray-200/90 shadow-[0_8px_32px_rgba(251,113,133,0.15),0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.98] active:shadow-lg transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400/60 focus:ring-offset-2 flex items-center justify-center"
            style={{ minWidth: 280 }}
            aria-label="Play or pause"
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="w-full h-full max-w-[320px] max-h-[320px] block"
              style={{ width: '100%', height: '100%', aspectRatio: '1' }}
              aria-hidden
            />
          </button>
        </div>

        {/* Journey progress */}
        {scheduleElements.length > 0 && (
          <div className="w-full max-w-sm mt-4 flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Journey progress</p>
            <div className="h-1.5 rounded-full bg-gray-200/80 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{ width: `${journeyProgress * 100}%` }}
              />
            </div>
            <div className="flex flex-col gap-2">
              {scheduleElements.map((el, i) => {
                const style = getLineStyle(el?.line)
                const timeRange = formatConnectionTime(el?.from?.depTime, el?.to?.arrTime)
                const isCurrent = i === currentSegmentIndex
                const isPast = i < currentSegmentIndex
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50 border border-indigo-200'
                        : isPast
                          ? 'bg-gray-50 border border-gray-100 opacity-70'
                          : 'bg-white/80 border border-gray-100'
                    }`}
                  >
                    <span
                      className="min-w-[44px] px-2 py-1 rounded-lg text-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: style.bg, color: style.fg }}
                    >
                      {style.label}
                    </span>
                    <span className={`flex-1 text-xs font-medium truncate ${isCurrent ? 'text-[#1F1F1F]' : 'text-gray-600'}`}>
                      {el?.from?.name ?? '—'} → {el?.to?.name ?? '—'}
                    </span>
                    {timeRange && (
                      <span className="text-[10px] text-gray-500 shrink-0">{timeRange}</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-indigo-600 shrink-0">Now</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Disruptions & delays */}
        <div className="w-full max-w-sm mt-4 pb-8 flex-shrink-0">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Route status</p>
          {announcementsLoading ? (
            <p className="text-xs text-gray-500 py-2">Checking for disruptions…</p>
          ) : hasDelays ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-800 mb-1">Delays on your route</p>
                <ul className="space-y-1">
                  {delayAnnouncements.slice(0, 3).map((a, i) => (
                    <li key={i} className="text-xs text-amber-800">
                      {getAnnouncementLabel(a)}
                    </li>
                  ))}
                </ul>
              </div>
              {announcements.length > delayAnnouncements.length && (
                <div className="rounded-xl border border-gray-200 bg-white/80 px-3 py-2.5">
                  <p className="text-xs font-semibold text-[#1F1F1F] mb-1">Other disruptions</p>
                  <ul className="space-y-1">
                    {announcements
                      .filter((a) => !mentionsDelay(getAnnouncementLabel(a)))
                      .slice(0, 3)
                      .map((a, i) => (
                        <li key={i} className="text-xs text-gray-700">
                          {getAnnouncementLabel(a)}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ) : announcements.length > 0 ? (
            <ul className="space-y-1.5">
              {announcements.slice(0, 5).map((a, i) => (
                <li
                  key={i}
                  className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5"
                >
                  {getAnnouncementLabel(a)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              No disruptions on your route. On time.
            </p>
          )}
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" className="hidden" />
    </div>
  )
}
