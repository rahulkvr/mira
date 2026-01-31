/**
 * Welcome screen — MIRA Commute Companion design.
 * First screen: logo, train illustration, headline, Get started (primary), Sign in (returning users).
 */
import trainSunrise from '../assets/train-sunrise.png'
import miraLogo from '../assets/mira-logo.png'

export function WelcomeScreen({ onGetStarted, onSignIn }) {
  return (
    <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden flex flex-col px-6 pt-12 pb-10 bg-[#F7F3EE]">
      {/* Top Logo */}
      <div className="shrink-0">
        <img src={miraLogo} alt="MIRA" className="h-8 w-auto" />
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="mb-10">
          <img
            src={trainSunrise}
            alt="Train with sunrise"
            className="w-36 h-36 object-contain mx-auto"
          />
        </div>
        <h1 className="text-[2rem] leading-[1.2] font-bold text-center mb-4 text-[#1F1F1F] tracking-tight">
          Make Idle Rides
          <br />
          Amazing
        </h1>
        <p className="text-base text-[#8B8B8B] text-center max-w-[280px]">
          Personalized learning during your commute.
        </p>
      </div>

      {/* Bottom CTAs */}
      <div className="shrink-0 space-y-4 pt-2">
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full h-14 px-8 py-4 rounded-full bg-[#1F1F1F] text-white font-semibold text-base shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          Get started
        </button>
        {onSignIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="w-full h-14 px-8 py-4 rounded-full bg-white border-2 border-[#1F1F1F] text-[#1F1F1F] font-semibold text-base shadow-sm hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  )
}
