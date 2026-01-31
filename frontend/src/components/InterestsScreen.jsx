/**
 * Interests screen — MIRA Interest Hierarchy.
 * Back, "What interests you?", core categories expand to show sub-interests, pick at least 3, Continue.
 */
import { useState } from 'react'

const MIN_INTERESTS = 3

const INTEREST_CATEGORIES = [
  {
    id: 'learning-growth',
    title: 'Learning & Growth',
    emoji: '📚',
    interests: [
      { id: 'languages', label: 'Languages', emoji: '🌍' },
      { id: 'tech-coding', label: 'Tech & Coding', emoji: '💻' },
      { id: 'career-skills', label: 'Career Skills', emoji: '💼' },
      { id: 'academic-topics', label: 'Academic Topics', emoji: '📖' },
      { id: 'finance-money', label: 'Finance & Money', emoji: '💰' },
      { id: 'science-innovation', label: 'Science & Innovation', emoji: '🔬' },
    ],
  },
  {
    id: 'stories-culture',
    title: 'Stories & Culture',
    emoji: '🎭',
    interests: [
      { id: 'fiction-storytelling', label: 'Fiction & Storytelling', emoji: '📖' },
      { id: 'news-current-events', label: 'News & Current Events', emoji: '📰' },
      { id: 'sports', label: 'Sports', emoji: '⚽' },
      { id: 'travel-places', label: 'Travel & Places', emoji: '✈️' },
      { id: 'music-audio', label: 'Music & Audio', emoji: '🎵' },
      { id: 'pop-culture', label: 'Pop Culture', emoji: '✨' },
    ],
  },
  {
    id: 'wellness-energy',
    title: 'Wellness & Energy',
    emoji: '🧘',
    interests: [
      { id: 'mindfulness-meditation', label: 'Mindfulness & Meditation', emoji: '🧘' },
      { id: 'fitness-movement', label: 'Fitness & Movement', emoji: '💪' },
      { id: 'nature-outdoors', label: 'Nature & Outdoors', emoji: '🌲' },
      { id: 'relationships-connection', label: 'Relationships & Connection', emoji: '❤️' },
      { id: 'personal-growth', label: 'Personal Growth', emoji: '🌱' },
      { id: 'rest-recovery', label: 'Rest & Recovery', emoji: '😴' },
    ],
  },
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

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
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
  const [expandedCategoryId, setExpandedCategoryId] = useState(null)

  const toggleInterest = (id) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id))
    } else {
      setSelectedInterests([...selectedInterests, id])
    }
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId))
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
        <p className="text-sm text-gray-500">Pick at least {MIN_INTERESTS} to personalize your experience. Tap a category to expand.</p>
      </div>

      {/* Selection counter */}
      <div className="mb-4 relative z-10 shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-[#1F1F1F]">{selectedInterests.length} selected</span>
          {!isValid && <span className="text-sm text-gray-400">({remaining} more needed)</span>}
          {isValid && <CheckIcon className="w-4 h-4 text-[#009252]" />}
        </div>
      </div>

      {/* Interest hierarchy — expandable categories */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10 -mx-6 px-6">
        <div className="space-y-3 pb-6">
          {INTEREST_CATEGORIES.map((category) => {
            const isExpanded = expandedCategoryId === category.id
            const selectedInCategory = category.interests.filter((i) => selectedInterests.includes(i.id)).length
            return (
              <div
                key={category.id}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50/80 transition-colors"
                >
                  <span className="text-base font-semibold text-[#1F1F1F] flex items-center gap-2">
                    <span>{category.emoji}</span>
                    <span>{category.title}</span>
                    {selectedInCategory > 0 && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {selectedInCategory} selected
                      </span>
                    )}
                  </span>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 flex flex-wrap gap-2 border-t border-gray-50">
                    {category.interests.map((interest, index) => {
                      const isSelected = selectedInterests.includes(interest.id)
                      const subGradient = GRADIENTS[index % GRADIENTS.length]
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest.id)}
                          className={`
                            inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                            ${isSelected
                              ? `bg-gradient-to-br ${subGradient} text-[#1F1F1F] shadow-md`
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                            }
                          `}
                        >
                          <span>{interest.emoji}</span>
                          <span>{interest.label}</span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#1F1F1F] flex items-center justify-center shrink-0">
                              <CheckIcon className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
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
