/**
 * Choose city screen from Onboarding Flow Design.
 * Shown after welcome; onContinue(city) → main app.
 */
import { useState } from 'react'

const CITIES = [
  'Hamburg',
  'Berlin',
  'Munich',
  'Cologne',
  'Frankfurt',
  'Stuttgart',
  'Bremen',
  'Hannover',
  'Other',
]

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function ChooseCityScreen({ onContinue }) {
  const [selectedCity, setSelectedCity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCities = CITIES.filter((city) =>
    city.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  const handleContinue = () => {
    if (selectedCity) onContinue(selectedCity)
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE] flex flex-col px-6 py-12 relative overflow-hidden">
      {/* Decorative shape */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFE6D3] rounded-bl-[80px] opacity-40" aria-hidden />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <h2 className="text-[32px] leading-[1.2] text-[#1A1A1A] mb-3">
          Which city are you in?
        </h2>
      </div>

      {/* Search field */}
      <div className="mb-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-[#E8E3DD] overflow-hidden">
          <div className="flex items-center px-5 py-4">
            <SearchIcon className="w-5 h-5 text-[#6B6B6B] mr-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city (e.g., Hamburg)"
              className="flex-1 outline-none text-[#1A1A1A] placeholder:text-[#6B6B6B] bg-transparent min-w-0"
            />
          </div>
        </div>
      </div>

      {/* Location button */}
      <button
        type="button"
        className="mb-8 flex items-center gap-2 text-[#6B6B6B] text-sm py-2 relative z-10"
      >
        <MapPinIcon className="w-4 h-4 shrink-0" strokeWidth={2} />
        Use my location
      </button>

      {/* City chips grid */}
      <div className="flex-1 mb-8 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {filteredCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`
                py-4 px-5 rounded-3xl border-2 transition-all text-left
                ${selectedCity === city
                  ? 'bg-[#F7D97A] border-[#F7D97A] shadow-[0_2px_12px_rgba(247,217,122,0.3)]'
                  : 'bg-white border-[#E8E3DD] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }
                active:scale-[0.97]
              `}
            >
              <span className="text-[#1A1A1A] font-medium">{city}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selectedCity}
        className={`
          w-full py-4 rounded-full transition-all relative z-10 font-medium
          ${selectedCity
            ? 'bg-[#1A1A1A] text-white active:scale-[0.98]'
            : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
          }
        `}
      >
        Continue
      </button>
    </div>
  )
}
