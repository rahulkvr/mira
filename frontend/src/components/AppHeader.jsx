/**
 * Main app header — MIRA logo (left) + profile (right).
 * First element on ride/explore/profile; pt-6 and pb-4 define top spacing and gap to content.
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
    <header className="flex justify-between items-center h-14 pt-10 px-4 pb-8 w-full gap-3">
      {/* Logo: trimmed to color borders, no transparent padding */}
      <div className="shrink-0 flex items-center h-10">
        <img
          src="/MIRA-logo-trimmed.png"
          alt="MIRA"
          className="h-10 w-auto"
        />
      </div>
      {onProfileClick && (
        <button
          type="button"
          onClick={onProfileClick}
          className="p-2 rounded-full bg-white shadow-ios flex items-center justify-center shrink-0 size-10"
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
