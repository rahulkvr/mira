/**
 * Profile tab — placeholder matching Commute Companion style.
 */
function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function ProfileTab() {
  return (
    <div className="min-h-screen px-5 pt-4 pb-6 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFFDF9] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-[#E0F5ED]/40 to-[#B8E8D4]/30 blur-3xl pointer-events-none" aria-hidden />

      <div className="relative z-10 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFE9A8] to-[#FFD56B] flex items-center justify-center shadow-lg shrink-0">
          <UserIcon className="w-7 h-7 text-[#1F1F1F]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1F1F1F]">Profile</h1>
          <p className="text-sm text-gray-500">Your preferences and stats</p>
        </div>
      </div>

      <div className="relative z-10 rounded-2xl bg-white/80 border border-gray-100 p-6 text-center text-gray-500">
        <p className="text-sm">Profile and settings coming soon.</p>
      </div>
    </div>
  )
}
