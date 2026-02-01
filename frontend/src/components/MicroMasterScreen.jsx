/**
 * MicroMaster — Learn Anything in Commute-Sized Lessons.
 * States: input (topic), loading, viewer (TikTok-style scroll).
 */
import { useState } from 'react'
import { MicroMasterViewer } from './MicroMasterViewer.jsx'

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function GraduationCapIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

function normalizeApiBase(apiBase) {
  const raw = (apiBase || '').trim().replace(/\/+$/, '')
  if (!raw) return ''
  return /^https?:\/\//i.test(raw) ? raw : `http://${raw}`
}

export function MicroMasterScreen({ onBack, apiBase = '' }) {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slides, setSlides] = useState(null)
  const [generatedTopic, setGeneratedTopic] = useState('')

  const apiBaseNorm = normalizeApiBase(apiBase)
  const apiUrl = apiBaseNorm ? `${apiBaseNorm}/api/micromaster/generate` : '/api/micromaster/generate'

  const handleGenerate = async () => {
    const t = topic.trim()
    if (!t) {
      setError('Enter a topic to learn')
      return
    }
    setError('')
    setLoading(true)
    setSlides(null)
    try {
      const width = typeof window !== 'undefined' ? window.innerWidth : 390
      const height = typeof window !== 'undefined' ? window.innerHeight : 844
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, width, height }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not generate lesson. Please try again.')
        return
      }
      setSlides(data.slides || [])
      setGeneratedTopic(data.topic || t)
    } catch (err) {
      setError(err.message || 'Network error. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleViewerBack = () => {
    setSlides(null)
  }

  if (slides && slides.length > 0) {
    return (
      <MicroMasterViewer
        slides={slides}
        topic={generatedTopic}
        onBack={handleViewerBack}
      />
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] px-6">
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-[#E4F0FF]/40 to-[#C8DFFF]/30 blur-3xl pointer-events-none" aria-hidden />
        <div className="absolute bottom-32 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#E0F5ED]/30 to-[#B8E8D4]/20 blur-3xl pointer-events-none" aria-hidden />

        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-[#C8DFFF] animate-ping opacity-30" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-0 rounded-full border-4 border-[#2B5A8A]/40 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#E4F0FF] to-[#8BB8E8] flex items-center justify-center shadow-lg">
              <GraduationCapIcon className="w-10 h-10 text-[#2B5A8A] animate-pulse" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">
            Generating your lesson
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            Creating 5 slides with visuals and audio…
          </p>
          <p className="text-xs text-gray-400">
            This usually takes about a minute
          </p>

          <div className="flex gap-2 mt-8" aria-hidden>
            <span className="w-2 h-2 rounded-full bg-[#8BB8E8] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#2B5A8A] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-[#1E3A5F] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-[#E4F0FF]/40 to-[#C8DFFF]/30 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-40 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#E0F5ED]/30 to-[#B8E8D4]/20 blur-3xl pointer-events-none" aria-hidden />

      <div className="px-6 pt-10 pb-8 max-w-2xl mx-auto relative z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 text-sm mb-8 hover:text-[#1F1F1F] transition-colors"
        >
          <ChevronLeftIcon className="w-[18px] h-[18px]" />
          Back
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E4F0FF] to-[#C8DFFF] flex items-center justify-center mb-6 shadow-lg">
            <GraduationCapIcon className="w-12 h-12 text-[#2B5A8A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">DoomScroll</h1>
          <p className="text-base text-gray-600 max-w-sm">
            Learn anything in commute-sized lessons. 5 slides, each with a visual and audio.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-semibold text-gray-600 mb-2">
              What do you want to learn?
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. JavaScript closures, Photosynthesis basics"
              disabled={loading}
              className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-white text-[#1F1F1F] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:border-transparent shadow-sm"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className={`w-full h-14 rounded-full font-semibold text-base transition-all ${
              loading || !topic.trim()
                ? 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
                : 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'
            }`}
          >
            Generate lesson
          </button>
        </div>
      </div>
    </div>
  )
}
