/**
 * Choice screen after selecting a route — two big cards:
 * 1. Generate podcast — goes to full podcast generation flow
 * 2. MicroMaster — byte-size learning (placeholder for now)
 */
import { useMemo } from 'react'

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function HeadphonesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 14v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3" />
      <path d="M21 14v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3" />
      <path d="M12 2a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Z" />
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

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function PodcastChoiceScreen({ routeSummary, durationMinutes, onSelectGeneratePodcast, onSelectMicroMaster, onBack }) {
  const summary = useMemo(() => {
    if (!routeSummary) return null
    return routeSummary
  }, [routeSummary])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      <div className="absolute top-16 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-[#F0E8FF]/30 to-[#DDD0FF]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-24 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-[#E0F5ED]/25 to-[#B8E8D4]/15 blur-3xl pointer-events-none" aria-hidden />

      <div className="px-6 pt-10 pb-8 max-w-2xl mx-auto relative z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors"
        >
          <ChevronLeftIcon className="w-[18px] h-[18px]" />
          Back to routes
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">What would you like?</h1>
          <p className="text-sm text-gray-500">Choose how to make your commute amazing.</p>
          {summary && (
            <div className="mt-4 rounded-2xl bg-white/80 border border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Your route</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">{summary}</p>
              {durationMinutes != null && (
                <p className="text-xs text-gray-500 mt-1">{Math.max(1, Math.round(durationMinutes))} min</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Card 1: Generate podcast */}
          <button
            type="button"
            onClick={onSelectGeneratePodcast}
            className="w-full rounded-3xl bg-white shadow-lg border border-gray-50 p-6 flex items-center gap-5 text-left hover:shadow-xl active:scale-[0.99] transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFF5D6] to-[#FFE9A8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <HeadphonesIcon className="w-8 h-8 text-[#6B5900]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#1F1F1F] mb-1">Generate podcast</h2>
              <p className="text-sm text-gray-500">
                An energetic, personalized episode tuned to your journey and interests.
              </p>
            </div>
            <ChevronRightIcon className="w-6 h-6 text-gray-400 shrink-0 group-hover:text-[#1F1F1F] transition-colors" />
          </button>

          {/* Card 2: DoomScroll */}
          <button
            type="button"
            onClick={onSelectMicroMaster}
            className="w-full rounded-3xl bg-white shadow-lg border border-gray-50 p-6 flex items-center gap-5 text-left hover:shadow-xl active:scale-[0.99] transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E4F0FF] to-[#C8DFFF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCapIcon className="w-8 h-8 text-[#2B5A8A]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#1F1F1F] mb-1">DoomScroll</h2>
              <p className="text-sm text-gray-500">
                Learn anything in commute-sized lessons.
              </p>
            </div>
            <ChevronRightIcon className="w-6 h-6 text-gray-400 shrink-0 group-hover:text-[#1F1F1F] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
