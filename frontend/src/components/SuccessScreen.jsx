/**
 * Success screen — MIRA Commute Companion design (OnboardingSuccess).
 * "You're all set!", Start planning a ride, Edit my preferences.
 */

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

export function SuccessScreen({ onStartRide, onEditPreferences }) {
  return (
    <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      {/* Decorative blobs */}
      <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#E0F5ED]/40 to-[#B8E8D4]/25 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-40 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#FFE9A8]/30 to-[#FFCF6B]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute top-1/2 right-0 w-56 h-56 rounded-full bg-gradient-to-br from-[#FFB5C5]/25 to-[#FF9AAD]/15 blur-3xl pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-0">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E0F5ED] to-[#B8E8D4] flex items-center justify-center mb-8 shrink-0">
          <CheckCircleIcon className="w-12 h-12 text-[#009252]" />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-3">You&apos;re all set!</h1>
          <p className="text-base text-gray-500 max-w-xs mx-auto">
            You&apos;re successfully onboarded on MIRA. Start planning your first learning ride.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-8 px-4 py-2 rounded-full bg-[#FFF5D6] shrink-0">
          <SparklesIcon className="w-4 h-4 text-[#FFBF40]" />
          <span className="text-sm font-medium text-[#1F1F1F]">Ready to explore</span>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3 relative z-10 shrink-0 pt-6">
        <button
          type="button"
          onClick={onStartRide}
          className="w-full h-14 px-8 py-4 rounded-full bg-[#1F1F1F] text-white font-semibold text-base shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98] transition-all"
        >
          Start planning a ride
        </button>
        {onEditPreferences && (
          <button
            type="button"
            onClick={onEditPreferences}
            className="w-full h-14 px-8 py-4 rounded-full text-[#888888] font-semibold text-base hover:bg-black/5 hover:text-[#1F1F1F] transition-all"
          >
            Edit my preferences
          </button>
        )}
      </div>
    </div>
  )
}
