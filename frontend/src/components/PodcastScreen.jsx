/**
 * Podcast generation screen — energetic, journey-aware UI + route status + visual player.
 */
import { useMemo, useEffect, useState } from 'react'

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 16l.7 2.2L22 19l-2.3.8L19 22l-.7-2.2L16 19l2.3-.8L19 16z" />
    </svg>
  )
}

function formatMinutes(minutes) {
  if (!minutes || Number.isNaN(minutes)) return '—'
  return `${Math.max(1, Math.round(minutes))} min`
}

/** Format Geofox date (DD.MM.YYYY) as short label e.g. "Sat 1 Feb" or "1 Feb 2026". */
function formatConnectionDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.trim().split('.')
  if (parts.length < 3) return dateStr
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date(year, month, day)
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return `${weekday} ${day} ${months[month] || ''}`
}

/** Format connection time for UX: same day → "06:55 – 07:15"; different days → short date + time. */
function formatConnectionTime(depTime, arrTime) {
  if (!depTime && !arrTime) return null
  const depDate = depTime?.date?.trim()
  const depT = depTime?.time?.trim()
  const arrDate = arrTime?.date?.trim()
  const arrT = arrTime?.time?.trim()
  if (!depT && !arrT) return null
  if (depDate === arrDate && depDate) {
    return depT && arrT ? `${depT} – ${arrT}` : depT || arrT
  }
  const shortDate = (d) => {
    if (!d) return ''
    const parts = d.split('.')
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10)
      const mon = parseInt(parts[1], 10)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${day} ${months[mon - 1] || ''}`
    }
    return d
  }
  const dep = depT ? (depDate === arrDate ? depT : `${shortDate(depDate)} ${depT}`.trim()) : ''
  const arr = arrT ? (depDate === arrDate ? arrT : `${shortDate(arrDate)} ${arrT}`.trim()) : ''
  if (dep && arr) return `${dep} – ${arr}`
  return dep || arr || null
}

const HVV_LINE_COLORS = {
  U1: { bg: '#0072bc', fg: '#fff' },
  U2: { bg: '#ed1c24', fg: '#fff' },
  U3: { bg: '#ffde00', fg: '#1a1a1a' },
  U4: { bg: '#00aaad', fg: '#fff' },
  S1: { bg: '#00962c', fg: '#fff' },
  S2: { bg: '#b41439', fg: '#fff' },
  S3: { bg: '#54216e', fg: '#fff' },
  S4: { bg: '#0082c8', fg: '#fff' },
  S5: { bg: '#008abd', fg: '#fff' },
  S11: { bg: '#00962c', fg: '#fff' },
  S21: { bg: '#b41439', fg: '#fff' },
  S31: { bg: '#54216e', fg: '#fff' },
}
const BUS_COLOR = { bg: '#E30613', fg: '#fff' }
const FERRY_COLOR = { bg: '#006DB2', fg: '#fff' }
const FALLBACK_COLOR = { bg: '#6B7280', fg: '#fff' }

function getLineStyle(line) {
  if (!line) return { ...FALLBACK_COLOR, label: '—' }
  const name = (line.name || '').trim().toUpperCase()
  const shortInfo = (line.type?.shortInfo || '').toUpperCase()
  const simpleType = line.type?.simpleType || ''
  const label = line.name || shortInfo || '—'
  const exact = HVV_LINE_COLORS[name]
  if (exact) return { ...exact, label }
  if (simpleType === 'BUS' || shortInfo === 'BUS' || /^\d+$/.test((line.name || '').trim())) {
    return { ...BUS_COLOR, label: line.name || 'Bus' }
  }
  if (simpleType === 'SHIP' || shortInfo === 'F') {
    return { ...FERRY_COLOR, label: line.name || 'Fähre' }
  }
  return { ...FALLBACK_COLOR, label }
}

const MAX_INTERESTS = 8

const FALLBACK_INTEREST_SUGGESTIONS = [
  'tech-news',
  'music-podcasts',
  'sports',
  'science',
  'productivity',
  'comedy',
  'history',
  'true-crime',
]

export function PodcastScreen({
  onBack,
  topic,
  onTopicChange,
  onGenerate,
  onClearPodcast,
  onListenNow,
  onInterestsChange,
  generating,
  errorMessage,
  audioUrl,
  durationMinutes,
  interests,
  routeSummary,
  offlineReady: _offlineReady,
  script: _script,
  routeStations: _routeStations = [],
  apiBase = '',
  scheduleElements = [],
}) {
  const [topicSuggestions, setTopicSuggestions] = useState([])
  const [topicSuggestionsLoading, setTopicSuggestionsLoading] = useState(false)
  const [interestSuggestions, setInterestSuggestions] = useState([])
  const [interestSuggestionsLoading, setInterestSuggestionsLoading] = useState(false)
  const [newInterestInput, setNewInterestInput] = useState('')

  const interestList = useMemo(() => (interests || []).slice(0, MAX_INTERESTS), [interests])
  const interestListKey = useMemo(() => interestList.join(','), [interestList])

  const apiBaseNorm = (() => {
    const raw = (apiBase || '').trim().replace(/\/+$/, '')
    if (!raw) return ''
    return /^https?:\/\//i.test(raw) ? raw : `http://${raw}`
  })()

  useEffect(() => {
    setInterestSuggestionsLoading(true)
    const url = apiBaseNorm ? `${apiBaseNorm}/api/podcast/suggest-interests` : '/api/podcast/suggest-interests'
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interests: interestList }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d?.error || r.statusText)))
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
          setInterestSuggestions(data.suggestions)
        } else {
          setInterestSuggestions(FALLBACK_INTEREST_SUGGESTIONS)
        }
      })
      .catch(() => setInterestSuggestions(FALLBACK_INTEREST_SUGGESTIONS))
      .finally(() => setInterestSuggestionsLoading(false))
  }, [apiBaseNorm, interestListKey, interestList])

  useEffect(() => {
    if (!routeSummary) return
    setTopicSuggestionsLoading(true)
    const topicUrl = apiBaseNorm ? `${apiBaseNorm}/api/podcast/suggest-topics` : '/api/podcast/suggest-topics'
    fetch(topicUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interests: interestList,
        route_summary: routeSummary,
        duration_minutes: durationMinutes ?? 10,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.suggestions)) setTopicSuggestions(data.suggestions)
        else setTopicSuggestions([])
      })
      .catch(() => setTopicSuggestions([]))
      .finally(() => setTopicSuggestionsLoading(false))
  }, [apiBaseNorm, routeSummary, durationMinutes, interestListKey, interestList])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFF5EB] relative">
      <div className="absolute top-16 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-[#F0E8FF]/30 to-[#DDD0FF]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-24 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-[#E0F5ED]/25 to-[#B8E8D4]/15 blur-3xl pointer-events-none" aria-hidden />

      <div className="px-6 pt-10 pb-8 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-[#1F1F1F] transition-colors"
        >
          <ChevronLeftIcon className="w-[18px] h-[18px]" />
          Back to routes
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1F1F1F] mb-2">Your commute podcast</h1>
          <p className="text-sm text-gray-500">An energetic, personalized episode tuned to your journey.</p>
        </div>

        <div className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Route</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">{routeSummary || 'Selected route'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Duration</p>
              <p className="text-lg font-bold text-[#1F1F1F]">{formatMinutes(durationMinutes)}</p>
            </div>
          </div>
          {scheduleElements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">Connections</p>
                {scheduleElements[0]?.from?.depTime?.date && (
                  <span className="text-xs text-gray-500 font-medium">
                    {formatConnectionDate(scheduleElements[0].from.depTime.date)}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {scheduleElements.map((el, i) => {
                  const style = getLineStyle(el.line)
                  const timeRange = formatConnectionTime(el.from?.depTime, el.to?.arrTime)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span
                        className="min-w-[52px] px-2.5 py-1.5 rounded-lg text-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: style.bg, color: style.fg }}
                      >
                        {style.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1F1F1F] truncate">
                          {el.from?.name} → {el.to?.name}
                        </p>
                      </div>
                      {timeRange && (
                        <span className="text-xs text-gray-500 font-medium shrink-0">{timeRange}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Your interests (edit here)</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {interestList.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FFF5D6] text-[#6B5900]"
                >
                  {interest.replace(/[-_]/g, ' ')}
                  {onInterestsChange && (
                    <button
                      type="button"
                      onClick={() => onInterestsChange(interestList.filter((i) => i !== interest))}
                      className="w-4 h-4 rounded-full hover:bg-[#6B5900]/20 flex items-center justify-center text-[#6B5900]"
                      aria-label={`Remove ${interest}`}
                    >
                      <span className="text-[10px] leading-none">×</span>
                    </button>
                  )}
                </span>
              ))}
            </div>
            {onInterestsChange && interestList.length < MAX_INTERESTS && (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const v = newInterestInput.trim().replace(/\s+/g, '-').toLowerCase()
                        if (v && !interestList.includes(v)) onInterestsChange([...interestList, v])
                        setNewInterestInput('')
                      }
                    }}
                    placeholder="Add interest or pick a suggestion below…"
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD56B]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = newInterestInput.trim().replace(/\s+/g, '-').toLowerCase()
                      if (v && !interestList.includes(v)) onInterestsChange([...interestList, v])
                      setNewInterestInput('')
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FFF5D6] text-[#6B5900] text-xs font-semibold hover:bg-[#FFE9A8]"
                  >
                    Add
                  </button>
                </div>
                {interestSuggestionsLoading ? (
                  <p className="text-xs text-gray-400 mt-2">Suggesting interests…</p>
                ) : interestSuggestions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-gray-500 font-medium self-center mr-0.5">Suggestions:</span>
                    {interestSuggestions
                      .filter((s) => !interestList.includes(s))
                      .slice(0, 6)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (interestList.length < MAX_INTERESTS && !interestList.includes(s)) {
                              onInterestsChange([...interestList, s])
                            }
                          }}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E4F0FF] text-[#2B5A8A] hover:bg-[#C8DFFF] transition-colors"
                        >
                          + {s.replace(/-/g, ' ')}
                        </button>
                      ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-4 h-4 text-[#FFB84D]" />
            <p className="text-sm font-semibold text-[#1F1F1F]">Suggested topic</p>
          </div>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange?.(e.target.value)}
            placeholder="Pick a suggestion below or type your own"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#1F1F1F] shadow-sm focus:border-[#FFD56B] focus:ring-2 focus:ring-[#FFD56B] focus:ring-offset-2 focus:outline-none"
          />
          {topicSuggestionsLoading ? (
            <p className="text-xs text-gray-400 mt-2">Loading topic ideas…</p>
          ) : topicSuggestions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {topicSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onTopicChange?.(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E4F0FF] text-[#2B5A8A] hover:bg-[#C8DFFF] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-gray-400 mt-2">Pick a suggestion or type your own — then generate.</p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {!audioUrl ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={!topic || generating}
            className={`
              w-full h-14 rounded-full font-semibold text-base transition-all
              ${(!topic || generating)
                ? 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
                : 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'}
            `}
          >
            Generate podcast
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onListenNow}
              className="w-full h-14 rounded-full font-semibold text-base bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98] transition-all"
            >
              Listen now
            </button>
            <button
              type="button"
              onClick={onClearPodcast}
              className="w-full h-12 rounded-full font-semibold text-sm border-2 border-[#1F1F1F] text-[#1F1F1F] hover:bg-[#1F1F1F] hover:text-white transition-all"
            >
              Generate new podcast
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
