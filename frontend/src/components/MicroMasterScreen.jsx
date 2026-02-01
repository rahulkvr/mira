/**
 * MicroMaster — Learn Anything in Commute-Sized Lessons.
 * Placeholder page; content generation coming later.
 */
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

export function MicroMasterScreen({ onBack }) {
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

        <div className="flex flex-col items-center text-center py-12">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E4F0FF] to-[#C8DFFF] flex items-center justify-center mb-6 shadow-lg">
            <GraduationCapIcon className="w-12 h-12 text-[#2B5A8A]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">MicroMaster</h1>
          <p className="text-base text-gray-600 mb-4 max-w-sm">
            Learn anything in commute-sized lessons.
          </p>
          <div className="rounded-2xl bg-white/80 border border-gray-100 p-8 max-w-sm">
            <p className="text-sm text-gray-500">Content coming soon. Pick a topic and get bite-sized lessons perfectly timed to your ride.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
