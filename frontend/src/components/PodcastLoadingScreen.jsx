/**
 * Full-page loading screen shown immediately after clicking "Generate podcast".
 * Keeps the user in a clear "generating" state until the player page is ready.
 */
export function PodcastLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] px-6">
      <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-[#FFE9A8]/40 to-[#FFD56B]/30 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-32 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#E0F5ED]/30 to-[#B8E8D4]/20 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Animated rings */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-[#FFE9A8] animate-ping opacity-30" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-0 rounded-full border-4 border-[#FFD56B] animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#FFB84D] to-[#E8A030] flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#1F1F1F] mb-2">
          Generating your podcast
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          Writing your script and creating audio…
        </p>
        <p className="text-xs text-gray-400">
          This usually takes 30–60 seconds
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-8" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-[#FFD56B] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#FFB84D] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#E8A030] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
