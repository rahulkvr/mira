/**
 * Explore tab — placeholder matching Commute Companion style.
 */
export function ExploreTab() {
  return (
    <div className="min-h-screen px-5 pt-4 pb-6 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFFDF9] relative overflow-hidden">
      <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#FFB5C5]/30 to-[#FF9AAD]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-60 -left-20 w-48 h-48 rounded-full bg-gradient-to-br from-[#B5E8D4]/25 to-[#9BC4DC]/15 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Explore something new</h1>
        <p className="text-sm text-gray-500 mb-6">
          Discover topics and learning content for your commute. Plan a ride first to get personalized suggestions.
        </p>
        <div className="rounded-2xl bg-white/80 border border-gray-100 p-6 text-center text-gray-500">
          <p className="text-sm">Explore features coming soon.</p>
        </div>
      </div>
    </div>
  )
}
