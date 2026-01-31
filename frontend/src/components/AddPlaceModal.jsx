/**
 * Modal to add a custom place: name, icon, color, and address.
 */
import { useState } from 'react'

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

function MapPinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export default function AddPlaceModal({
  isOpen,
  onClose,
  cityName = 'Hamburg',
  iconOptions = [],
  colorOptions = [],
  onSave,
}) {
  const [name, setName] = useState('')
  const [selectedIconId, setSelectedIconId] = useState(iconOptions[0]?.id ?? 'map-pin')
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? { hex: '#E8E3DD', gradient: 'from-[#E8E3DD] to-[#D4CFC9]' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState(null)

  const addresses = MOCK_ADDRESSES[cityName] || MOCK_ADDRESSES.Hamburg
  const filteredAddresses = searchQuery.trim()
    ? addresses.filter((addr) => addr.toLowerCase().includes(searchQuery.toLowerCase()))
    : addresses.slice(0, 5)

  const canSave = name.trim() && (selectedAddress || searchQuery.trim())

  const handleSave = () => {
    if (!canSave) return
    const address = selectedAddress || searchQuery.trim()
    onSave({
      name: name.trim(),
      iconId: selectedIconId,
      colorHex: selectedColor.hex,
      colorGradient: selectedColor.gradient,
      address,
    })
    setName('')
    setSelectedIconId(iconOptions[0]?.id ?? 'map-pin')
    setSelectedColor(colorOptions[0] ?? { hex: '#E8E3DD', gradient: 'from-[#E8E3DD] to-[#D4CFC9]' })
    setSearchQuery('')
    setSelectedAddress(null)
    onClose()
  }

  const handleClose = () => {
    setName('')
    setSelectedIconId(iconOptions[0]?.id ?? 'map-pin')
    setSelectedColor(colorOptions[0] ?? { hex: '#E8E3DD', gradient: 'from-[#E8E3DD] to-[#D4CFC9]' })
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8F0] rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-[#1F1F1F]">Add a place</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <XIcon className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-5">
          {/* Name */}
          <div className="pt-4 pb-3">
            <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Parents, Coffee shop"
              className="w-full h-12 pl-4 rounded-2xl border border-gray-200 bg-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:border-transparent"
            />
          </div>

          {/* Icon */}
          <div className="pb-3">
            <label className="block text-sm font-medium text-gray-600 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map(({ id, IconComponent }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedIconId(id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    selectedIconId === id
                      ? 'bg-[#1F1F1F] text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-[22px] h-[22px]" />
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="pb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.hex}
                  type="button"
                  onClick={() => setSelectedColor(opt)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    selectedColor.hex === opt.hex ? 'border-[#1F1F1F] scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: opt.hex }}
                  title={opt.hex}
                />
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="pb-3">
            <label className="block text-sm font-medium text-gray-600 mb-2">Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="w-[18px] h-[18px]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search address or stop"
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:border-transparent"
              />
            </div>
          </div>
          <div className="space-y-2">
            {filteredAddresses.map((address, index) => {
              const selected = selectedAddress === address
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAddress(address)}
                  className={`w-full rounded-2xl p-3 flex items-center gap-3 text-left transition-all ${
                    selected ? 'bg-gradient-to-br from-[#FFF5D6] to-[#FFE9A8] shadow-md' : 'bg-white border border-gray-100 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-[#1F1F1F]' : 'bg-gray-100'}`}>
                    {selected ? <CheckIcon className="w-4 h-4 text-white" /> : <MapPinIcon className="w-4 h-4 text-gray-500" />}
                  </div>
                  <p className={`text-sm flex-1 min-w-0 truncate ${selected ? 'font-semibold text-[#1F1F1F]' : 'text-gray-600'}`}>{address}</p>
                </button>
              )
            })}
          </div>
          {searchQuery.trim() && (
            <p className="text-xs text-gray-500 mt-2">Pick a suggestion or save what you typed by clicking Save.</p>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 bg-white flex gap-3 shrink-0">
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
            disabled={!canSave}
            className={`flex-1 h-14 rounded-full font-semibold text-base transition-all ${
              canSave ? 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] active:scale-[0.98]' : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </>
  )
}
