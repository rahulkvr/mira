/**
 * MicroMasterViewer — TikTok-style vertical scroll of fullscreen lesson cards.
 * Each card: full-bleed image, title overlay, audio that plays when in view.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

export function MicroMasterViewer({ slides = [], topic = '', onBack }) {
  const containerRef = useRef(null)
  const audioRefs = useRef({})
  const [activeIndex, setActiveIndex] = useState(0)

  const setAudioRef = useCallback((index, el) => {
    audioRefs.current[index] = el
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = parseInt(entry.target.dataset.slideIndex, 10)
          if (!Number.isNaN(index)) setActiveIndex(index)
        }
      },
      { threshold: 0.5, root: container }
    )

    const slides = container.querySelectorAll('[data-slide-index]')
    slides.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [slides.length])

  useEffect(() => {
    Object.keys(audioRefs.current).forEach((key) => {
      const audio = audioRefs.current[key]
      if (audio) {
        if (parseInt(key, 10) === activeIndex) {
          audio.play().catch(() => {})
        } else {
          audio.pause()
          audio.currentTime = 0
        }
      }
    })
  }, [activeIndex])

  if (!slides.length) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/90 text-sm hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
              aria-hidden
            />
          ))}
        </div>
        <div className="w-16" />
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory h-dvh min-h-screen"
        style={{ scrollBehavior: 'smooth' }}
      >
        {slides.map((slide, i) => {
          const imageUrl = slide.image_base64
            ? `data:image/png;base64,${slide.image_base64}`
            : null
          return (
            <article
              key={i}
              data-slide-index={i}
              className="min-h-dvh min-h-screen w-full snap-start snap-always shrink-0 relative flex flex-col justify-end"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: imageUrl || 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1a1a2e 100%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative z-10 px-6 pb-16 pt-8">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-widest mb-1">
                  {i + 1} / {slides.length}
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {slide.title || `Slide ${i + 1}`}
                </h2>
              </div>
              {slide.audio_base64 && (
                <audio
                  ref={(el) => setAudioRef(i, el)}
                  preload="auto"
                  className="hidden"
                  onEnded={() => {}}
                >
                  <source
                    src={`data:audio/mpeg;base64,${slide.audio_base64}`}
                    type="audio/mpeg"
                  />
                </audio>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
