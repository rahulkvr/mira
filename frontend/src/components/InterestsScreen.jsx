/**
 * Interests screen — MIRA Commute Companion design (OnboardingInterests).
 * Back, "What interests you?", pick at least 3, chips with emoji, Continue.
 */
import { useState } from 'react'

const MIN_INTERESTS = 3

const INTERESTS = [
  { id: 'baby-child', label: 'Baby & Child', emoji: '👶' },
  { id: 'delivery-services', label: 'Delivery & Services', emoji: '📦' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'self-care', label: 'Self-care / Wellness', emoji: '🧘' },
  { id: 'events', label: 'Events', emoji: '🎉' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'food-drinks', label: 'Food & Drinks', emoji: '🍕' },
  { id: 'jewelry', label: 'Jewelry', emoji: '💎' },
  { id: 'bikes-mobility', label: 'Bikes & Mobility', emoji: '🚲' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'love-relationships', label: 'Love & Relationships', emoji: '❤️' },
  { id: 'outdoors-nature', label: 'Outdoors & Nature', emoji: '🌲' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'glasses', label: 'Glasses', emoji: '👓' },
  { id: 'pets', label: 'Pets', emoji: '🐶' },
  { id: 'pharmacy-health', label: 'Pharmacy / Health', emoji: '💊' },
  { id: 'home-decoration', label: 'Home & Decoration', emoji: '🏠' },
  { id: 'education-learning', label: 'Education & Learning', emoji: '📚' },
  { id: 'finance-money', label: 'Finance & Money', emoji: '💰' },
  { id: 'career-productivity', label: 'Career & Productivity', emoji: '💼' },
  { id: 'languages', label: 'Languages', emoji: '🌍' },
  { id: 'art-creativity', label: 'Art & Creativity', emoji: '🎨' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'news-trends', label: 'News & Trends', emoji: '📰' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

const GRADIENTS = [
  'from-[#FFF5D6] to-[#FFE9A8]',
  'from-[#FFE4EC] to-[#FFCCD8]',
  'from-[#E4F0FF] to-[#C8DFFF]',
  'from-[#E0F5ED] to-[#B8E8D4]',
  'from-[#FFEDE4] to-[#FFD9C8]',
  'from-[#F0E8FF] to-[#DDD0FF]',
]

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
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

export function InterestsScreen({ onComplete, onBack }) {
  const [selectedInterests, setSelectedInterests] = useState([])

  const toggleInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id))
    } else {
      setSelectedInterests([...selectedInterests, id])
    }
  }

  const isValid = selectedInterests.length >= MIN_INTERESTS
  const remaining = MIN_INTERESTS - selectedInterests.length

  return (
    <div className="h-dvh min-h-dvh max-h-dvh overflow-hidden flex flex-col px-6 pt-14 pb-10 bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      {/* Decorative blobs */}
      <div className="absolute top-20 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-[#F0E8FF]/30 to-[#DDD0FF]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-40 -left-20 w-56 h-56 rounded-full bg-gradient-to-br from-[#E0F5ED]/25 to-[#B8E8D4]/15 blur-3xl pointer-events-none" aria-hidden />

      {/* Header */}
      <div className="mb-6 relative z-10 shrink-0">
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
        <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">What interests you?</h1>
        <p className="text-sm text-gray-500">Pick at least {MIN_INTERESTS} categories to personalize your experience.</p>
      </div>

      {/* Selection counter */}
      <div className="mb-4 relative z-10 shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-[#1F1F1F]">{selectedInterests.length} selected</span>
          {!isValid && <span className="text-sm text-gray-400">({remaining} more needed)</span>}
          {isValid && <CheckIcon className="w-4 h-4 text-[#009252]" />}
        </div>
      </div>

      {/* Interest chips — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10 -mx-6 px-6">
        <div className="flex flex-wrap gap-2 pb-6">
          {INTERESTS.map((interest, index) => {
            const isSelected = selectedInterests.includes(interest.id)
            const gradient = GRADIENTS[index % GRADIENTS.length]
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200
                  ${isSelected
                    ? `bg-gradient-to-br ${gradient} text-[#1F1F1F] shadow-md scale-105`
                    : 'bg-white text-gray-600 shadow-sm border border-gray-100 hover:border-gray-200'
                  }
                `}
              >
                <span>{interest.emoji}</span>
                <span>{interest.label}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#1F1F1F] flex items-center justify-center ml-1 shrink-0">
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4 shrink-0 relative z-10">
        <button
          type="button"
          onClick={() => onComplete(selectedInterests)}
          disabled={!isValid}
          className={`
            w-full h-14 px-8 py-4 rounded-full font-semibold text-base transition-all
            ${isValid
              ? 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'
              : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
            }
          `}
        >
          {isValid ? 'Save interests' : `Select ${remaining} more`}
        </button>
      </div>
    </div>
  )
}
