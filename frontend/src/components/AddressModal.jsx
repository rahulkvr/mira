/**
 * Modal to add/edit address for a place.
 * useExactAddressSearch (Home/Work): exact address autocomplete via Nominatim.
 * placeType gym|university: gym/university POIs in city via Nominatim.
 * Otherwise: mock suggestions by city.
 */
import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const MOCK_ADDRESSES = {
  Hamburg: [
    'Jungfernstieg 1, 20095 Hamburg',
    'Mönckebergstraße 7, 20095 Hamburg',
    'Reeperbahn 36, 20359 Hamburg',
    'Elbphilharmonie, 20457 Hamburg',
    'Hamburg Hauptbahnhof, 20099 Hamburg',
    'Altona Bahnhof, 22765 Hamburg',
    'Blankenese, 22587 Hamburg',
    'Wandsbek Markt, 22041 Hamburg',
  ],
  Berlin: [
    'Alexanderplatz 1, 10178 Berlin',
    'Brandenburger Tor, 10117 Berlin',
    'Potsdamer Platz 1, 10785 Berlin',
    'Kurfürstendamm 21, 10719 Berlin',
  ],
  Munich: [
    'Marienplatz 1, 80331 München',
    'Stachus, 80335 München',
    'Viktualienmarkt, 80331 München',
  ],
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
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

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
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

export default function AddressModal({ isOpen, placeLabel, cityName = 'Hamburg', useExactAddressSearch = false, placeType = null, onSave, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const usePlaceTypeSearch = placeType === 'gym' || placeType === 'university'
  const useApiSearch = useExactAddressSearch || usePlaceTypeSearch

  const mockAddresses = MOCK_ADDRESSES[cityName] || MOCK_ADDRESSES.Hamburg
  const mockFiltered = searchQuery.trim()
    ? mockAddresses.filter((addr) => addr.toLowerCase().includes(searchQuery.toLowerCase()))
    : mockAddresses.slice(0, 5)

  useEffect(() => {
    if (usePlaceTypeSearch && cityName?.trim()) {
      const t = setTimeout(async () => {
        setSuggestionsLoading(true)
        try {
          const params = new URLSearchParams({ city: cityName.trim(), placeType })
          if (searchQuery.trim()) params.set('q', searchQuery.trim())
          const res = await fetch(`${API_BASE}/api/addresses?${params}`)
          const contentType = res.headers.get('content-type') || ''
          if (!res.ok || !contentType.includes('application/json')) {
            setAddressSuggestions([])
            return
          }
          const data = await res.json()
          setAddressSuggestions(data.results || [])
        } catch {
          setAddressSuggestions([])
        } finally {
          setSuggestionsLoading(false)
        }
      }, 300)
      return () => clearTimeout(t)
    }
    if (!useExactAddressSearch || !searchQuery.trim() || searchQuery.length < 3) {
      setAddressSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const params = new URLSearchParams({ q: searchQuery.trim() })
        if (cityName?.trim()) params.set('city', cityName.trim())
        const res = await fetch(`${API_BASE}/api/addresses?${params}`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          setAddressSuggestions([])
          return
        }
        const data = await res.json()
        setAddressSuggestions(data.results || [])
      } catch {
        setAddressSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [useExactAddressSearch, usePlaceTypeSearch, placeType, searchQuery, cityName])

  const suggestions = useApiSearch ? addressSuggestions : mockFiltered
  const displayList = useApiSearch ? suggestions.map((r) => r.display_name) : suggestions

  const handleSave = () => {
    const toSave = selectedAddress || searchQuery.trim()
    if (toSave) {
      onSave(toSave)
      setSearchQuery('')
      setSelectedAddress(null)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedAddress(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F0] rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1F1F1F]">Add {placeLabel} address</h2>
            <p className="text-sm text-gray-500">Search for an address or stop</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <XIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon className="w-[18px] h-[18px]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={useExactAddressSearch ? 'Street, number, city' : usePlaceTypeSearch ? `Search ${placeType} in ${cityName || 'city'}` : 'Enter address or stop'}
              className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white text-[15px] font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Custom address hint when user has typed */}
        {searchQuery.trim() && (
          <p className="px-5 pb-2 text-xs text-gray-500">
            Pick a suggestion below or save what you typed by clicking Save.
          </p>
        )}

        {/* Address suggestions */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            {useExactAddressSearch ? 'Exact address' : usePlaceTypeSearch ? `${placeType} in ${cityName || 'city'}` : 'Suggestions'}
          </p>
          {useExactAddressSearch && suggestionsLoading && (
            <p className="text-sm text-gray-500 py-2">Searching…</p>
          )}
          <div className="space-y-2">
            {displayList.map((address, index) => {
              const selected = selectedAddress === address
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAddress(address)}
                  className={`
                    w-full rounded-3xl p-4 flex items-center gap-3 text-left transition-all
                    ${selected
                      ? 'bg-gradient-to-br from-[#FFF5D6] to-[#FFE9A8] shadow-md'
                      : 'bg-white shadow-lg border border-gray-50 hover:shadow-xl'
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selected ? 'bg-[#1F1F1F]' : 'bg-gray-100'
                    }`}
                  >
                    {selected ? (
                      <CheckIcon className="w-4 h-4 text-white" />
                    ) : (
                      <MapPinIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <p className={`text-sm flex-1 min-w-0 truncate ${selected ? 'font-semibold text-[#1F1F1F]' : 'text-gray-600'}`}>
                    {address}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 h-14 rounded-full border-0 bg-transparent text-[#888888] font-semibold text-base hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedAddress && !searchQuery.trim()}
            className={`
              flex-1 h-14 rounded-full font-semibold text-base transition-all
              ${selectedAddress || searchQuery.trim()
                ? 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] active:scale-[0.98]'
                : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
              }
            `}
          >
            Save
          </button>
        </div>
      </div>
    </>
  )
}
