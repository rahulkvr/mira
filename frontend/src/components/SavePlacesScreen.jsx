/**
 * Save frequent places screen from Onboarding Flow Design.
 * Shown after city; onContinue() → main app.
 */
function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function BriefcaseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
function DumbbellIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.5 6.5h11" />
      <path d="m6 20 4.5-4.5" />
      <path d="m18 4 4.5 4.5" />
      <path d="m6 4 4.5 4.5" />
      <path d="m18 20-4.5-4.5" />
    </svg>
  )
}
function GraduationCapIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}
function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

const PLACES = [
  { id: 'home', label: 'Home', Icon: HomeIcon, color: '#F2B5C4' },
  { id: 'work', label: 'Work', Icon: BriefcaseIcon, color: '#BFD7EA' },
  { id: 'gym', label: 'Gym', Icon: DumbbellIcon, color: '#BFE6D3' },
  { id: 'university', label: 'University', Icon: GraduationCapIcon, color: '#F7D97A' },
]

export function SavePlacesScreen({ onContinue }) {
  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[32px] leading-[1.2] text-[#1A1A1A] mb-3">
          Save your frequent places
        </h2>
        <p className="text-base text-[#6B6B6B]">
          So planning rides becomes 1-tap.
        </p>
      </div>

      {/* Places list */}
      <div className="flex-1 mb-6">
        <div className="space-y-3 mb-4">
          {PLACES.map((place) => {
            const Icon = place.Icon
            return (
              <div
                key={place.id}
                className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E8E3DD] p-5 flex items-center gap-4"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: place.color, opacity: 0.3 }}
                >
                  <Icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2} />
                </div>
                <span className="flex-1 text-[#1A1A1A] font-medium">{place.label}</span>
                <button
                  type="button"
                  className="px-5 py-2 bg-[#F7F3EE] text-[#1A1A1A] rounded-full text-sm font-medium transition active:scale-95"
                >
                  Add
                </button>
              </div>
            )
          })}
        </div>

        {/* Add another place */}
        <button
          type="button"
          className="w-full bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E8E3DD] p-5 flex items-center gap-4 transition-all active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F7F3EE] flex items-center justify-center flex-shrink-0">
            <PlusIcon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2} />
          </div>
          <span className="text-[#6B6B6B]">Add another place</span>
        </button>

        {/* Map preview card */}
        <div className="mt-6 bg-[#BFD7EA] bg-opacity-20 rounded-3xl p-6 border border-[#BFD7EA] border-opacity-30">
          <div className="aspect-[16/9] bg-white bg-opacity-50 rounded-2xl mb-4 flex items-center justify-center">
            <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
              <path d="M30 50 L40 30 L50 40 L60 25" stroke="#1A1A1A" strokeWidth="2" fill="none" opacity="0.2" />
              <circle cx="40" cy="30" r="8" fill="#E2001A" opacity="0.8" />
              <circle cx="40" cy="30" r="3" fill="#fff" />
            </svg>
          </div>
          <p className="text-sm text-[#6B6B6B] text-center">
            You can edit anytime.
          </p>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onContinue}
        className="w-full bg-[#1A1A1A] text-white py-4 rounded-full font-medium transition-all active:scale-[0.98]"
      >
        Continue
      </button>
    </div>
  )
}
