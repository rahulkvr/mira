/**
 * Interests screen — MIRA Interest Hierarchy.
 * Card-based selection with smooth animations. Tap category → detail → pick interests.
 */
import { useState } from 'react'
/* eslint-disable-next-line no-unused-vars -- motion used as namespace in JSX (motion.div, motion.button, etc.) */
import { motion, AnimatePresence } from 'framer-motion'

const MIN_INTERESTS = 3

const INTEREST_CATEGORIES = [
  {
    id: 'learning-growth',
    title: 'Learning & Growth',
    emoji: '📚',
    gradient: 'from-amber-100 to-orange-100',
    interests: [
      {
        id: 'languages',
        label: 'Languages',
        emoji: '🌍',
        subInterests: [
          { id: 'language-german', label: 'German', emoji: '🇩🇪' },
          { id: 'language-french', label: 'French', emoji: '🇫🇷' },
          { id: 'language-spanish', label: 'Spanish', emoji: '🇪🇸' },
          { id: 'language-english', label: 'English', emoji: '🇬🇧' },
          { id: 'language-japanese', label: 'Japanese', emoji: '🇯🇵' },
        ],
      },
      {
        id: 'tech-coding',
        label: 'Tech & Coding',
        emoji: '💻',
        subInterests: [
          { id: 'tech-web-dev', label: 'Web Development', emoji: '🌐' },
          { id: 'tech-python', label: 'Python', emoji: '🐍' },
          { id: 'tech-javascript', label: 'JavaScript', emoji: '📜' },
          { id: 'tech-data-science', label: 'Data Science', emoji: '📊' },
          { id: 'tech-ai-ml', label: 'AI & ML', emoji: '🤖' },
        ],
      },
      {
        id: 'career-skills',
        label: 'Career Skills',
        emoji: '💼',
        subInterests: [
          { id: 'career-leadership', label: 'Leadership', emoji: '👥' },
          { id: 'career-communication', label: 'Communication', emoji: '💬' },
          { id: 'career-productivity', label: 'Productivity', emoji: '⚡' },
          { id: 'career-interview-prep', label: 'Interview Prep', emoji: '📋' },
          { id: 'career-remote-work', label: 'Remote Work', emoji: '🏠' },
        ],
      },
      {
        id: 'academic-topics',
        label: 'Academic Topics',
        emoji: '📖',
        subInterests: [
          { id: 'academic-history', label: 'History', emoji: '🏛️' },
          { id: 'academic-philosophy', label: 'Philosophy', emoji: '🤔' },
          { id: 'academic-math', label: 'Math', emoji: '🔢' },
          { id: 'academic-literature', label: 'Literature', emoji: '📚' },
          { id: 'academic-psychology', label: 'Psychology', emoji: '🧠' },
        ],
      },
      {
        id: 'finance-money',
        label: 'Finance & Money',
        emoji: '💰',
        subInterests: [
          { id: 'finance-investing', label: 'Investing', emoji: '📈' },
          { id: 'finance-budgeting', label: 'Budgeting', emoji: '📉' },
          { id: 'finance-saving', label: 'Saving', emoji: '🐷' },
          { id: 'finance-crypto', label: 'Crypto', emoji: '₿' },
          { id: 'finance-real-estate', label: 'Real Estate', emoji: '🏠' },
        ],
      },
      {
        id: 'science-innovation',
        label: 'Science & Innovation',
        emoji: '🔬',
        subInterests: [
          { id: 'science-space', label: 'Space & Astronomy', emoji: '🪐' },
          { id: 'science-biology', label: 'Biology', emoji: '🧬' },
          { id: 'science-physics', label: 'Physics', emoji: '⚛️' },
          { id: 'science-environment', label: 'Environment', emoji: '🌍' },
          { id: 'science-tech-innovation', label: 'Tech & Innovation', emoji: '💡' },
        ],
      },
    ],
  },
  {
    id: 'stories-culture',
    title: 'Stories & Culture',
    emoji: '🎭',
    gradient: 'from-rose-100 to-pink-100',
    interests: [
      {
        id: 'fiction-storytelling',
        label: 'Fiction & Storytelling',
        emoji: '📖',
        subInterests: [
          { id: 'fiction-thriller', label: 'Thriller', emoji: '🔪' },
          { id: 'fiction-romance', label: 'Romance', emoji: '💕' },
          { id: 'fiction-scifi', label: 'Sci-Fi', emoji: '🚀' },
          { id: 'fiction-mystery', label: 'Mystery', emoji: '🔍' },
          { id: 'fiction-fantasy', label: 'Fantasy', emoji: '🐉' },
        ],
      },
      {
        id: 'news-current-events',
        label: 'News & Current Events',
        emoji: '📰',
        subInterests: [
          { id: 'news-politics', label: 'Politics', emoji: '🏛️' },
          { id: 'news-business', label: 'Business', emoji: '📊' },
          { id: 'news-world', label: 'World News', emoji: '🌐' },
          { id: 'news-tech', label: 'Tech News', emoji: '📱' },
          { id: 'news-climate', label: 'Climate', emoji: '🌡️' },
        ],
      },
      {
        id: 'sports',
        label: 'Sports',
        emoji: '⚽',
        subInterests: [
          { id: 'sports-football', label: 'Football', emoji: '⚽' },
          { id: 'sports-basketball', label: 'Basketball', emoji: '🏀' },
          { id: 'sports-tennis', label: 'Tennis', emoji: '🎾' },
          { id: 'sports-running-athletics', label: 'Running & Athletics', emoji: '🏃' },
          { id: 'sports-esports', label: 'Esports', emoji: '🎮' },
        ],
      },
      {
        id: 'travel-places',
        label: 'Travel & Places',
        emoji: '✈️',
        subInterests: [
          { id: 'travel-adventure', label: 'Adventure', emoji: '🏔️' },
          { id: 'travel-food', label: 'Food & Culinary', emoji: '🍜' },
          { id: 'travel-culture', label: 'Culture & History', emoji: '🏛️' },
          { id: 'travel-city', label: 'City Breaks', emoji: '🌆' },
          { id: 'travel-nature-eco', label: 'Nature & Eco', emoji: '🌿' },
        ],
      },
      {
        id: 'music-audio',
        label: 'Music & Audio',
        emoji: '🎵',
        subInterests: [
          { id: 'music-pop', label: 'Pop', emoji: '🎤' },
          { id: 'music-hiphop', label: 'Hip Hop', emoji: '🎧' },
          { id: 'music-jazz', label: 'Jazz', emoji: '🎷' },
          { id: 'music-classical', label: 'Classical', emoji: '🎻' },
          { id: 'music-lofi', label: 'Lo-fi', emoji: '📼' },
        ],
      },
      {
        id: 'pop-culture',
        label: 'Pop Culture',
        emoji: '✨',
        subInterests: [
          { id: 'pop-tv', label: 'TV & Series', emoji: '📺' },
          { id: 'pop-movies', label: 'Movies', emoji: '🎬' },
          { id: 'pop-celebrities', label: 'Celebrities', emoji: '⭐' },
          { id: 'pop-memes-internet', label: 'Memes & Internet', emoji: '😂' },
          { id: 'pop-fashion', label: 'Fashion', emoji: '👗' },
        ],
      },
    ],
  },
  {
    id: 'wellness-energy',
    title: 'Wellness & Energy',
    emoji: '🧘',
    gradient: 'from-emerald-100 to-teal-100',
    interests: [
      {
        id: 'mindfulness-meditation',
        label: 'Mindfulness & Meditation',
        emoji: '🧘',
        subInterests: [
          { id: 'mindfulness-breathing', label: 'Breathing', emoji: '🌬️' },
          { id: 'mindfulness-sleep', label: 'Sleep', emoji: '😴' },
          { id: 'mindfulness-stress', label: 'Stress Relief', emoji: '🧘‍♂️' },
          { id: 'mindfulness-guided', label: 'Guided Meditation', emoji: '🎧' },
          { id: 'mindfulness-movement', label: 'Mindful Movement', emoji: '🌿' },
        ],
      },
      {
        id: 'fitness-movement',
        label: 'Fitness & Movement',
        emoji: '💪',
        subInterests: [
          { id: 'fitness-yoga', label: 'Yoga', emoji: '🧘‍♀️' },
          { id: 'fitness-running', label: 'Running', emoji: '🏃' },
          { id: 'fitness-strength', label: 'Strength', emoji: '🏋️' },
          { id: 'fitness-walking', label: 'Walking', emoji: '🚶' },
          { id: 'fitness-cycling', label: 'Cycling', emoji: '🚴' },
        ],
      },
      {
        id: 'nature-outdoors',
        label: 'Nature & Outdoors',
        emoji: '🌲',
        subInterests: [
          { id: 'nature-hiking', label: 'Hiking', emoji: '🥾' },
          { id: 'nature-camping', label: 'Camping', emoji: '⛺' },
          { id: 'nature-gardening', label: 'Gardening', emoji: '🌱' },
          { id: 'nature-wildlife', label: 'Wildlife', emoji: '🦌' },
          { id: 'nature-running-trails', label: 'Running & Trails', emoji: '🏃' },
        ],
      },
      {
        id: 'relationships-connection',
        label: 'Relationships & Connection',
        emoji: '❤️',
        subInterests: [
          { id: 'relationships-family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
          { id: 'relationships-friends', label: 'Friends', emoji: '👫' },
          { id: 'relationships-dating', label: 'Dating', emoji: '💑' },
          { id: 'relationships-communication', label: 'Communication', emoji: '💬' },
          { id: 'relationships-community', label: 'Community', emoji: '🤝' },
        ],
      },
      {
        id: 'personal-growth',
        label: 'Personal Growth',
        emoji: '🌱',
        subInterests: [
          { id: 'growth-habits', label: 'Habits & Routines', emoji: '📅' },
          { id: 'growth-confidence', label: 'Confidence', emoji: '💪' },
          { id: 'growth-goals', label: 'Goal Setting', emoji: '🎯' },
          { id: 'growth-creativity', label: 'Creativity', emoji: '🎨' },
          { id: 'growth-leadership', label: 'Leadership', emoji: '🌟' },
        ],
      },
      {
        id: 'rest-recovery',
        label: 'Rest & Recovery',
        emoji: '😴',
        subInterests: [
          { id: 'rest-sleep', label: 'Sleep', emoji: '😴' },
          { id: 'rest-relaxation', label: 'Relaxation', emoji: '🛁' },
          { id: 'rest-recovery-body', label: 'Recovery', emoji: '🩹' },
          { id: 'rest-digital-detox', label: 'Digital Detox', emoji: '📵' },
          { id: 'rest-self-care', label: 'Self-Care', emoji: '💆' },
        ],
      },
    ],
  },
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

function SparklesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

function getSelectedCountInCategory(category, selectedInterests) {
  let count = 0
  category.interests.forEach((interest) => {
    if (interest.subInterests) {
      count += interest.subInterests.filter((sub) => selectedInterests.includes(sub.id)).length
    } else if (selectedInterests.includes(interest.id)) {
      count += 1
    }
  })
  return count
}

export function InterestsScreen({ onComplete, onBack, saving = false, errorMessage = '' }) {
  const [selectedInterests, setSelectedInterests] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)

  const toggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const isValid = selectedInterests.length >= MIN_INTERESTS
  const remaining = MIN_INTERESTS - selectedInterests.length
  const activeCategoryData = activeCategory ? INTEREST_CATEGORIES.find((c) => c.id === activeCategory) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/5 to-teal-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-rose-500/5 to-pink-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 shrink-0"
        >
          {onBack && activeCategory === null && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors group"
            >
              <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          )}
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-3 tracking-tight">
            What interests you?
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            Choose at least 3 topics to personalize your experience. The more you pick, the better we can tailor content for you.
          </p>
        </motion.div>

        {/* Selection counter pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 shrink-0"
        >
          <div className="inline-flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <motion.span
                className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary inline-flex items-center justify-center text-white text-xs font-semibold leading-none"
                key={selectedInterests.length}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {selectedInterests.length}
              </motion.span>
              <span className="text-sm font-medium text-[#1F1F1F] leading-5">selected</span>
            </div>
            {!isValid && (
              <span className="text-sm text-gray-500">{remaining} more to go</span>
            )}
            {isValid && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                className="flex items-center gap-1.5 text-[#009252]"
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Ready!</span>
              </motion.div>
            )}
          </div>
          {errorMessage && (
            <p className="mt-3 text-sm text-red-500">{errorMessage}</p>
          )}
        </motion.div>

        {/* Categories grid or Category detail */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-5 px-5 pb-32">
          <AnimatePresence mode="wait">
            {activeCategory === null ? (
              <motion.div
                key="categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -50 }}
                className="grid gap-4"
              >
                {INTEREST_CATEGORIES.map((category, index) => {
                  const selectedCount = getSelectedCountInCategory(category, selectedInterests)
                  return (
                    <motion.button
                      key={category.id}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setActiveCategory(category.id)}
                      className={`group relative w-full p-5 rounded-2xl text-left transition-all duration-300
                        bg-gradient-to-br ${category.gradient} border border-white/50
                        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                        shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-3xl mb-2 block">{category.emoji}</span>
                          <h3 className="text-lg font-semibold text-[#1F1F1F] mb-1">
                            {category.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {category.interests.length} interests
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {selectedCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold"
                            >
                              {selectedCount} picked
                            </motion.div>
                          )}
                          <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center group-hover:bg-white transition-colors">
                            <ChevronLeftIcon className="w-4 h-4 text-[#1F1F1F] rotate-180" />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </motion.div>
            ) : activeCategoryData ? (
              <CategoryDetail
                key="detail"
                category={activeCategoryData}
                selectedInterests={selectedInterests}
                onToggle={toggleInterest}
                onBack={() => setActiveCategory(null)}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#FFF5EB] via-[#FFF5EB] to-transparent pt-12 pb-safe-bottom">
          <div className="max-w-2xl mx-auto">
            <motion.button
              type="button"
              onClick={() => onComplete(selectedInterests)}
              disabled={!isValid || saving}
              whileHover={isValid && !saving ? { scale: 1.02 } : {}}
              whileTap={isValid && !saving ? { scale: 0.98 } : {}}
              className={`w-full h-14 rounded-2xl font-semibold text-base transition-all duration-300
                ${isValid && !saving
                  ? 'bg-primary text-white shadow-lg hover:shadow-xl'
                  : 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
                }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Saving...
                </span>
              ) : isValid ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckIcon className="w-5 h-5" />
                  Save interests
                </span>
              ) : (
                `Select ${remaining} more`
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryDetail({ category, selectedInterests, onToggle, onBack }) {
  const [expandedInterest, setExpandedInterest] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors group"
      >
        <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        All categories
      </button>

      <div className={`p-5 rounded-2xl bg-gradient-to-br ${category.gradient} border border-white/50 mb-6`}>
        <span className="text-4xl mb-2 block">{category.emoji}</span>
        <h2 className="text-xl font-bold text-[#1F1F1F]">{category.title}</h2>
      </div>

      <div className="space-y-3">
        {category.interests.map((interest, index) => {
          const hasSubInterests = interest.subInterests && interest.subInterests.length > 0
          const isExpanded = expandedInterest === interest.id
          const isSelected = selectedInterests.includes(interest.id)
          const selectedSubCount = hasSubInterests
            ? interest.subInterests.filter((sub) => selectedInterests.includes(sub.id)).length
            : 0

          return (
            <motion.div
              key={interest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                type="button"
                onClick={() => {
                  if (hasSubInterests) {
                    setExpandedInterest(isExpanded ? null : interest.id)
                  } else {
                    onToggle(interest.id)
                  }
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200
                  ${isSelected && !hasSubInterests
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm'
                  }`}
              >
                <span className="text-2xl">{interest.emoji}</span>
                <span className="flex-1 text-left font-medium">{interest.label}</span>
                {hasSubInterests ? (
                  <div className="flex items-center gap-2">
                    {selectedSubCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                        {selectedSubCount}
                      </span>
                    )}
                    <ChevronLeftIcon
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? '-rotate-90' : 'rotate-180'}`}
                    />
                  </div>
                ) : isSelected ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </motion.div>
                ) : null}
              </button>

              <AnimatePresence>
                {hasSubInterests && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pl-6 flex flex-wrap gap-2">
                      {interest.subInterests.map((sub, subIndex) => {
                        const isSubSelected = selectedInterests.includes(sub.id)
                        return (
                          <motion.button
                            key={sub.id}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: subIndex * 0.05 }}
                            onClick={() => onToggle(sub.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                              ${isSubSelected
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            <span>{sub.emoji}</span>
                            <span>{sub.label}</span>
                            {isSubSelected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <CheckIcon className="w-3.5 h-3.5" />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
