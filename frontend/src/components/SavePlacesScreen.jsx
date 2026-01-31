/**
 * Save frequent places screen — MIRA Commute Companion design (OnboardingPlaces).
 * Back, place cards (Home, Work, Gym, University), tap to add address via modal, map preview, Continue.
 */
import { useState, useEffect } from 'react'
import AddressModal from './AddressModal.jsx'

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search'

function geocodeAddress(address) {
  const params = new URLSearchParams({ q: address, format: 'json', limit: '1' })
  return fetch(`${NOMINATIM_SEARCH}?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'MIRA/1.0 (commute app)' },
  }).then((r) => r.json())
}

function bboxFromCoords(coords) {
  const lats = Object.values(coords).map((c) => c.lat)
  const lons = Object.values(coords).map((c) => c.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const pad = 0.015
  return [minLon - pad, minLat - pad, maxLon + pad, maxLat + pad]
}

function HomeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function BriefcaseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
function DumbbellIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}
function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
function Edit2Icon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
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

const PLACE_PRESETS = [
  { id: 'home', label: 'Home', icon: 'home', IconComponent: HomeIcon, gradient: 'from-[#FFF5D6] to-[#FFE9A8]' },
  { id: 'work', label: 'Work', icon: 'work', IconComponent: BriefcaseIcon, gradient: 'from-[#FFE4EC] to-[#FFCCD8]' },
  { id: 'gym', label: 'Gym', icon: 'gym', IconComponent: DumbbellIcon, gradient: 'from-[#E4F0FF] to-[#C8DFFF]' },
  { id: 'university', label: 'University', icon: 'university', IconComponent: GraduationCapIcon, gradient: 'from-[#E0F5ED] to-[#B8E8D4]' },
]

export function SavePlacesScreen({ onContinue, onBack, city }) {
  const [savedPlaces, setSavedPlaces] = useState([])
  const [placeCoords, setPlaceCoords] = useState({})
  const [mapLoading, setMapLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(null)

  // Geocode saved addresses and fetch map data (Nominatim: ~1 req/sec)
  useEffect(() => {
    if (savedPlaces.length === 0) {
      setPlaceCoords({})
      setMapLoading(false)
      return
    }
    setPlaceCoords({})
    setMapLoading(true)
    const next = async (index) => {
      if (index >= savedPlaces.length) {
        setMapLoading(false)
        return
      }
      const place = savedPlaces[index]
      if (!place.address) {
        next(index + 1)
        return
      }
      try {
        const results = await geocodeAddress(place.address)
        const first = results?.[0]
        if (first?.lat != null && first?.lon != null) {
          setPlaceCoords((prev) => ({
            ...prev,
            [place.id]: { lat: parseFloat(first.lat), lon: parseFloat(first.lon) },
          }))
        }
      } catch {
        // ignore geocode failure
      }
      if (index + 1 < savedPlaces.length) {
        setTimeout(() => next(index + 1), 1100)
      } else {
        setMapLoading(false)
      }
    }
    next(0)
  }, [savedPlaces])

  const handleOpenModal = (preset) => {
    setSelectedPreset(preset)
    setModalOpen(true)
  }

  const handleSaveAddress = (address) => {
    if (selectedPreset) {
      const existingIndex = savedPlaces.findIndex((p) => p.id === selectedPreset.id)
      if (existingIndex >= 0) {
        const updated = [...savedPlaces]
        updated[existingIndex] = { ...updated[existingIndex], address }
        setSavedPlaces(updated)
      } else {
        setSavedPlaces([
          ...savedPlaces,
          { id: selectedPreset.id, label: selectedPreset.label, icon: selectedPreset.icon, address },
        ])
      }
    }
    setModalOpen(false)
    setSelectedPreset(null)
  }

  const getPlaceAddress = (id) => savedPlaces.find((p) => p.id === id)?.address
  const isPlaceSaved = (id) => savedPlaces.some((p) => p.id === id && p.address)

  return (
    <div className="h-dvh min-h-dvh max-h-dvh flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-40 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#FFB5C5]/30 to-[#FF9AAD]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-60 -left-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#FFE4A0]/25 to-[#FFCF6B]/15 blur-3xl pointer-events-none" aria-hidden />

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
        <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Save your frequent places</h1>
        <p className="text-sm text-gray-500">Tap a place to add its address. Planning rides becomes 1-tap.</p>
      </div>

      {/* Place cards + map — scrollable so content is not cut off */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10">
      <div className="space-y-3 mb-6">
        {PLACE_PRESETS.map((preset) => {
          const isSaved = isPlaceSaved(preset.id)
          const address = getPlaceAddress(preset.id)
          const IconComponent = preset.IconComponent
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleOpenModal(preset)}
              className="w-full rounded-3xl bg-white shadow-lg border border-gray-50 p-5 flex items-center gap-4 text-left hover:shadow-xl active:scale-[0.99] transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${preset.gradient} flex items-center justify-center shrink-0`}>
                <IconComponent className="w-[22px] h-[22px] text-[#1F1F1F]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-[#1F1F1F]">{preset.label}</p>
                {isSaved ? (
                  <p className="text-xs text-gray-500 truncate">{address}</p>
                ) : (
                  <p className="text-xs text-gray-400">Tap to add address</p>
                )}
              </div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isSaved ? 'bg-[#1F1F1F]' : 'bg-gray-100'
                }`}
              >
                {isSaved ? (
                  <Edit2Icon className="w-3.5 h-3.5 text-white" />
                ) : (
                  <PlusIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
          )
        })}

        {/* Add another place */}
        <button
          type="button"
          className="w-full rounded-3xl bg-transparent border-2 border-gray-200 p-5 flex items-center gap-4 text-left hover:border-gray-300 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
            <PlusIcon className="w-[22px] h-[22px] text-gray-400" />
          </div>
          <p className="text-base text-gray-500">Add another place</p>
        </button>
      </div>

      {/* Map preview card */}
      <div className="mb-6">
        <div className="rounded-3xl bg-gradient-to-br from-[#E4F0FF] to-[#C8DFFF] p-4 overflow-hidden">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center shrink-0">
              <MapPinIcon className="w-[18px] h-[18px] text-[#1F1F1F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1F1F1F]">
                {savedPlaces.length > 0
                  ? `${savedPlaces.length} place${savedPlaces.length > 1 ? 's' : ''} saved`
                  : 'Your places will appear on the map'}
              </p>
              {savedPlaces.length > 0 && (
                <p className="text-xs text-gray-600 truncate">{savedPlaces.map((p) => p.label).join(', ')}</p>
              )}
            </div>
          </div>
          {savedPlaces.length > 0 && (
            <div className="h-28 rounded-xl mt-2 relative overflow-hidden bg-gray-100 border border-gray-200/50">
              {mapLoading && Object.keys(placeCoords).length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Loading map…
                </div>
              ) : Object.keys(placeCoords).length > 0 ? (
                <iframe
                  title="Map of saved places"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${bboxFromCoords(placeCoords).join(',')}&layer=mapnik`}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-gradient-to-br from-[#E4F0FF]/30 to-[#C8DFFF]/20">
                  {savedPlaces.slice(0, 4).map((place) => {
                    const preset = PLACE_PRESETS.find((p) => p.id === place.id)
                    return preset ? (
                      <div key={place.id} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${preset.gradient} flex items-center justify-center shadow-sm`}>
                          <preset.IconComponent className="w-3 h-3 text-[#1F1F1F]" />
                        </div>
                        <span className="text-[9px] font-medium text-gray-600 mt-1">{place.label}</span>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* CTA */}
      <div className="pt-6 shrink-0 relative z-10">
        <button
          type="button"
          onClick={() => onContinue(savedPlaces)}
          className="w-full h-14 px-8 py-4 rounded-full bg-[#1F1F1F] text-white font-semibold text-base shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98] transition-all"
        >
          Continue
        </button>
        <p className="text-xs text-center text-gray-400 mt-3">You can skip and add places later</p>
      </div>

      <AddressModal
        isOpen={modalOpen}
        placeLabel={selectedPreset?.label || ''}
        cityName={city}
        onSave={handleSaveAddress}
        onClose={() => {
          setModalOpen(false)
          setSelectedPreset(null)
        }}
      />
    </div>
  )
}
