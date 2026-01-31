/**
 * Bottom tab bar — Ride, Explore, Profile (matches Commute Companion).
 */
function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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
  { id: 'ride', label: 'Ride', Icon: MapPinIcon },
  { id: 'explore', label: 'Explore', Icon: CompassIcon },
  { id: 'profile', label: 'Profile', Icon: UserIcon },
]

export function BottomNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 py-2 px-2 max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.Icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center gap-1 py-2 px-6 transition-all duration-200"
              >
                <div className="relative">
                  {isActive && (
                    <div
                      className="absolute -inset-2.5 bg-gradient-to-br from-[#FFE9A8] to-[#FFD56B] rounded-2xl -z-10"
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors ${isActive ? 'text-[#1F1F1F]' : 'text-gray-400'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`text-[11px] transition-colors ${
                    isActive ? 'text-[#1F1F1F] font-semibold' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
