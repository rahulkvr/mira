/**
 * Choose city screen — MIRA Commute Companion design (OnboardingCity).
 * Back, search, Use my location, city chips (pastel variants), Continue.
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
]

const CHIP_VARIANTS = [
  'pastelYellow',
  'pastelPink',
  'pastelBlue',
  'pastelMint',
  'pastelPeach',
]

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function NavigationIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function getChipClasses(variant, selected) {
  const base = 'inline-flex items-center gap-2 rounded-full font-medium transition-all cursor-pointer select-none px-4 py-2.5 text-sm '
  if (selected) {
    return base + 'bg-[#1F1F1F] text-white shadow-md'
  }
  const variants = {
    pastelYellow: 'bg-gradient-to-r from-[#FFF5D6] to-[#FFE9A8] text-[#6B5900] hover:shadow-md',
    pastelPink: 'bg-gradient-to-r from-[#FFE4EC] to-[#FFCCD8] text-[#8B3A50] hover:shadow-md',
    pastelBlue: 'bg-gradient-to-r from-[#E4F0FF] to-[#C8DFFF] text-[#2B5A8A] hover:shadow-md',
    pastelMint: 'bg-gradient-to-r from-[#E0F5ED] to-[#B8E8D4] text-[#1A6B4A] hover:shadow-md',
    pastelPeach: 'bg-gradient-to-r from-[#FFEDE4] to-[#FFD9C8] text-[#8B4A30] hover:shadow-md',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-600 hover:border-gray-400',
  }
  return base + (variants[variant] || variants.pastelYellow)
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

function reverseGeocode(lat, lon) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
  })
  return fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'MIRA/1.0 (commute app)' },
  }).then((r) => r.json())
}

function cityFromAddress(address) {
  if (!address) return null
  const city = address.city || address.town || address.village || address.municipality || address.county
  return city ? String(city).trim() : null
}

function matchKnownCity(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  const found = CITIES.find((c) => c.toLowerCase() === lower || lower.includes(c.toLowerCase()))
  return found || null
}

export function ChooseCityScreen({ onContinue, onBack }) {
  const [selectedCity, setSelectedCity] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)

  const filteredCities = searchQuery.trim()
    ? CITIES.filter((c) => c.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : CITIES

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location not supported')
      setSelectedCity('Hamburg')
      return
    }
    setLocationError(null)
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        reverseGeocode(latitude, longitude)
          .then((data) => {
            const address = data?.address
            const cityName = cityFromAddress(address)
            const known = cityName ? matchKnownCity(cityName) : null
            if (known) {
              setSelectedCity(known)
              setSearchQuery('')
            } else if (cityName) {
              setSelectedCity('Other')
              setSearchQuery(cityName)
            } else {
              setSelectedCity('Hamburg')
            }
          })
          .catch(() => {
            setLocationError('Could not get city')
            setSelectedCity('Hamburg')
          })
          .finally(() => setLocationLoading(false))
      },
      () => {
        setLocationError('Location denied or unavailable')
        setSelectedCity('Hamburg')
        setLocationLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  const handleContinue = () => {
    if (selectedCity) onContinue(selectedCity)
  }

  return (
    <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      {/* Decorative blobs */}
      <div className="absolute top-32 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#B5E8D4]/40 to-[#9BC4DC]/30 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-40 -left-16 w-40 h-40 rounded-full bg-gradient-to-br from-[#FFE4A0]/30 to-[#FFCF6B]/20 blur-3xl pointer-events-none" aria-hidden />

      {/* Header */}
      <div className="mb-8 relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors"
          >
            <ChevronLeftIcon className="w-[18px] h-[18px]" />
            Back
          </button>
        )}
        <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Which city are you in?</h1>
        <p className="text-sm text-gray-500">We&apos;ll find the best transit options for you.</p>
      </div>

      {/* Search */}
      <div className="mb-4 relative z-10">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <MapPinIcon className="w-[18px] h-[18px]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, e.g., Hamburg"
            className="flex h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 py-3 text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:ring-offset-2 focus:border-transparent shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Use my location */}
      <div className="mb-6 relative z-10">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locationLoading}
          className="flex items-center gap-4 py-3 group disabled:opacity-70 disabled:pointer-events-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E4F0FF] to-[#C8DFFF] flex items-center justify-center group-hover:shadow-md transition-shadow shrink-0">
            {locationLoading ? (
              <span className="w-[18px] h-[18px] border-2 border-[#1F1F1F] border-t-transparent rounded-full animate-spin" aria-hidden />
            ) : (
              <NavigationIcon className="w-[18px] h-[18px] text-[#1F1F1F]" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-600 group-hover:text-[#1F1F1F] transition-colors">
            {locationLoading ? 'Getting location…' : 'Use my location'}
          </span>
        </button>
        {locationError && (
          <p className="text-xs text-amber-700 mt-1 ml-16">{locationError}. Using Hamburg.</p>
        )}
      </div>

      {/* City chips — scrollable if many */}
      <div className="flex flex-wrap gap-2.5 mb-auto min-h-0 overflow-auto relative z-10 py-1">
        {filteredCities.map((city, index) => (
          <button
            key={city}
            type="button"
            onClick={() => {
              setLocationError(null)
              setSelectedCity(city)
            }}
            className={getChipClasses(CHIP_VARIANTS[index % CHIP_VARIANTS.length], selectedCity === city)}
          >
            {city}
            {selectedCity === city && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setLocationError(null)
            setSelectedCity('Other')
          }}
          className={getChipClasses('outline', selectedCity === 'Other')}
        >
          Other
          {selectedCity === 'Other' && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
        </button>
      </div>

      {/* CTA — anchored at bottom */}
      <div className="pt-6 shrink-0 relative z-10">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedCity}
          className={`
            w-full h-14 px-8 py-4 rounded-full font-semibold text-base transition-all
            ${selectedCity
              ? 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'
              : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
