/**
 * Welcome screen from Onboarding Flow Design.
 * Shown once before the route finder (Get started → main app).
 */
export function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col px-6 py-12">
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Illustration */}
        <div className="mb-12">
          <svg width="200" height="140" viewBox="0 0 200 140" className="mx-auto" aria-hidden>
            <circle cx="100" cy="70" r="35" fill="#F7D97A" opacity="0.6" />
            <circle cx="100" cy="70" r="25" fill="#F7D97A" />
            <rect x="60" y="85" width="80" height="32" rx="8" fill="#BFD7EA" />
            <rect x="65" y="90" width="16" height="12" rx="3" fill="#1A1A1A" opacity="0.1" />
            <rect x="85" y="90" width="16" height="12" rx="3" fill="#1A1A1A" opacity="0.1" />
            <rect x="105" y="90" width="16" height="12" rx="3" fill="#1A1A1A" opacity="0.1" />
            <rect x="125" y="90" width="16" height="12" rx="3" fill="#1A1A1A" opacity="0.1" />
            <circle cx="75" cy="117" r="5" fill="#1A1A1A" />
            <circle cx="95" cy="117" r="5" fill="#1A1A1A" />
            <circle cx="105" cy="117" r="5" fill="#1A1A1A" />
            <circle cx="125" cy="117" r="5" fill="#1A1A1A" />
            <path d="M155 75 C155 70, 160 65, 165 65 C170 65, 175 70, 175 75 C175 82, 165 92, 165 92 C165 92, 155 82, 155 75 Z" fill="#F2B5C4" />
            <circle cx="165" cy="75" r="3" fill="#fff" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center mb-12">
          <h2 className="text-[32px] leading-[1.2] text-[#1A1A1A] mb-4 px-4">
            Make Idle Rides Amazing
          </h2>
          <p className="text-base text-[#6B6B6B] px-4">
            Personalized learning during your commute.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div>
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full bg-[#1A1A1A] text-white py-4 rounded-full transition-all active:scale-[0.98] font-medium"
        >
          Get started
        </button>
      </div>
    </div>
  )
}
