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
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t }),
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
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">MicroMaster</h1>
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
            {loading ? 'Generating your lesson…' : 'Generate lesson'}
          </button>
        </div>

        {loading && (
          <div className="mt-8 space-y-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
