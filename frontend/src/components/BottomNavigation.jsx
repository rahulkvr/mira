/**
 * Bottom tab bar — Ride, Explore, Profile (matches Commute Companion).
 */
function TransitIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 19v2" /><path d="M16 19v2" /><path d="M2 13h2" /><path d="M20 13h2" /><path d="M4 17h16" /><path d="M4 9h16" /><path d="M4 5h16v8H4z" />
    </svg>
  )
}

function CompassIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const TABS = [
  { id: 'ride', label: 'Ride', Icon: TransitIcon },
  { id: 'explore', label: 'Explore', Icon: CompassIcon },
  { id: 'profile', label: 'Profile', Icon: UserIcon },
]

export function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-white/90 backdrop-blur-2xl rounded-3xl shadow-ios p-2 flex justify-between items-center z-50 ring-1 ring-black/5">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.Icon
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-200"
          >
            <div className={`w-12 h-8 rounded-2xl flex items-center justify-center ${isActive ? 'bg-accent' : ''}`}>
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-gray-900 font-bold' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
                isActive ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
