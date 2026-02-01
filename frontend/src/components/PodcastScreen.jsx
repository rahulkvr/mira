/**
 * Podcast generation screen — calm, focused UI.
 */
import { useMemo } from 'react'

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 16l.7 2.2L22 19l-2.3.8L19 22l-.7-2.2L16 19l2.3-.8L19 16z" />
    </svg>
  )
}

function formatMinutes(minutes) {
  if (!minutes || Number.isNaN(minutes)) return '—'
  return `${Math.max(1, Math.round(minutes))} min`
}

export function PodcastScreen({
  onBack,
  topic,
  onTopicChange,
  onGenerate,
  generating,
  errorMessage,
  audioUrl,
  durationMinutes,
  interests,
  routeSummary,
  offlineReady,
  script,
}) {
  const interestChips = useMemo(() => (interests || []).slice(0, 6), [interests])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      <div className="absolute top-16 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-[#F0E8FF]/30 to-[#DDD0FF]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-24 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-[#E0F5ED]/25 to-[#B8E8D4]/15 blur-3xl pointer-events-none" aria-hidden />

      <div className="px-6 pt-10 pb-8 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors"
        >
          <ChevronLeftIcon className="w-[18px] h-[18px]" />
          Back to routes
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Your commute podcast</h1>
          <p className="text-sm text-gray-500">A calm, personalized episode tuned to your journey.</p>
        </div>

        <div className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Route</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">{routeSummary || 'Selected route'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Duration</p>
              <p className="text-lg font-bold text-[#1F1F1F]">{formatMinutes(durationMinutes)}</p>
            </div>
          </div>
          {interestChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {interestChips.map((interest) => (
                <span key={interest} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#FFF5D6] text-[#6B5900]">
                  {interest.replace(/[-_]/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-4 h-4 text-[#FFB84D]" />
            <p className="text-sm font-semibold text-[#1F1F1F]">Suggested topic</p>
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange?.(e.target.value)}
            placeholder="A calm story for your commute"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#1F1F1F] shadow-sm focus:border-[#FFD56B] focus:ring-2 focus:ring-[#FFD56B] focus:ring-offset-2 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">Edit this if you want a different angle.</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={onGenerate}
          disabled={!topic || generating}
          className={`
            w-full h-14 rounded-full font-semibold text-base transition-all
            ${(!topic || generating)
              ? 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
              : 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'}
          `}
        >
          {generating ? 'Generating audio…' : 'Generate podcast'}
        </button>

        {audioUrl && (
          <div className="mt-6 rounded-3xl bg-white shadow-lg border border-gray-50 p-5">
            <p className="text-sm font-semibold text-[#1F1F1F] mb-3">Your audio is ready</p>
            <audio controls src={audioUrl} className="w-full" />
            {offlineReady && (
              <p className="text-xs text-gray-500 mt-2">Saved for offline playback.</p>
            )}
            {script && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 cursor-pointer">Show script</summary>
                <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{script}</p>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
