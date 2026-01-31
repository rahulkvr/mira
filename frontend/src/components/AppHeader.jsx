/**
 * Main app header — MIRA logo + profile button (matches Commute Companion).
 */
function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function AppHeader({ onProfileClick }) {
  return (
    <header className="sticky top-0 z-40 bg-[#FFF8F0]/95 backdrop-blur-sm px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFE9A8] to-[#FFD56B] flex items-center justify-center">
          <span className="text-sm font-bold text-[#1F1F1F]">M</span>
        </div>
        <span className="text-lg font-bold text-[#1F1F1F]">MIRA</span>
      </div>
      {onProfileClick && (
        <button
          type="button"
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Open profile"
        >
          <UserIcon className="w-[18px] h-[18px] text-gray-600" />
        </button>
      )}
    </header>
  )
}
