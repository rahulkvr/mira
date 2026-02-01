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

export function AppHeader({ onProfileClick, userName }) {
  return (
    <header className="flex justify-between items-center py-8 px-6 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-gray-900">M</div>
        <span className="font-bold tracking-tight text-gray-900 uppercase text-xs tracking-[0.2em]">Mira</span>
      </div>
      {onProfileClick && (
        <button
          type="button"
          onClick={onProfileClick}
          className="p-2 rounded-full bg-white shadow-ios flex items-center gap-2"
          aria-label="Open profile"
        >
          <UserIcon className="w-5 h-5 text-gray-600" />
          {userName && (
            <span className="text-sm font-semibold text-gray-900 max-w-[120px] truncate hidden sm:inline">
              {userName}
            </span>
          )}
        </button>
      )}
    </header>
  )
}
