/**
 * Modal to add a custom place: name, icon, color, and address (no suggestions).
 */
import { useState } from 'react'

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
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
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] ?? { hex: '#B8A9C9', gradient: 'from-[#D4C8ED] to-[#B8A9C9]' })
  const [addressInput, setAddressInput] = useState('')

  const canSave = name.trim() && addressInput.trim()

  const handleSave = () => {
    if (!canSave) return
    const address = addressInput.trim()
    onSave({
      name: name.trim(),
      iconId: selectedIconId,
      colorHex: selectedColor.hex,
      colorGradient: selectedColor.gradient,
      address,
    })
    setName('')
    setSelectedIconId(iconOptions[0]?.id ?? 'map-pin')
    setSelectedColor(colorOptions[0] ?? { hex: '#B8A9C9', gradient: 'from-[#D4C8ED] to-[#B8A9C9]' })
    setAddressInput('')
    onClose()
  }

  const handleClose = () => {
    setName('')
    setSelectedIconId(iconOptions[0]?.id ?? 'map-pin')
    setSelectedColor(colorOptions[0] ?? { hex: '#B8A9C9', gradient: 'from-[#D4C8ED] to-[#B8A9C9]' })
    setAddressInput('')
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
          <div className="pb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon className="w-[18px] h-[18px]" />
              </div>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter address"
                className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B] focus:border-transparent"
              />
            </div>
          </div>
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
