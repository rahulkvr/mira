/**
 * Podcast generation screen — energetic, journey-aware UI + route status + visual player.
 */
import { useMemo, useEffect, useState, useRef } from 'react'

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
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
  interestsLoading = false,
  routeSummary,
  offlineReady: _offlineReady,
  script: _script,
  routeStations: _routeStations = [],
  apiBase = '',
  scheduleElements = [],
}) {
  const [interestSuggestions, setInterestSuggestions] = useState([])
  const [interestSuggestionsLoading, setInterestSuggestionsLoading] = useState(false)
  const [newInterestInput, setNewInterestInput] = useState('')
  const [voices, setVoices] = useState([])
  const [voicesLoading, setVoicesLoading] = useState(false)
  const [selectedVoiceId, setSelectedVoiceId] = useState('')
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false)
  const lastGeneratedVoiceRef = useRef(undefined)
  const lastGeneratedInterestsKeyRef = useRef(undefined)

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
    setVoicesLoading(true)
    const url = apiBaseNorm ? `${apiBaseNorm}/api/podcast/voices` : '/api/podcast/voices'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.voices) && data.voices.length > 0) setVoices(data.voices)
        else setVoices([])
      })
      .catch(() => setVoices([]))
      .finally(() => setVoicesLoading(false))
  }, [apiBaseNorm])

  useEffect(() => {
    if (!audioUrl) {
      lastGeneratedVoiceRef.current = undefined
      lastGeneratedInterestsKeyRef.current = undefined
      return
    }
    if (interestsLoading) return
    if (lastGeneratedVoiceRef.current === undefined && lastGeneratedInterestsKeyRef.current === undefined) {
      lastGeneratedVoiceRef.current = selectedVoiceId
      lastGeneratedInterestsKeyRef.current = interestListKey
      return
    }
    if (lastGeneratedVoiceRef.current === selectedVoiceId && lastGeneratedInterestsKeyRef.current === interestListKey) return
    if (generating) return
    lastGeneratedVoiceRef.current = selectedVoiceId
    lastGeneratedInterestsKeyRef.current = interestListKey
    onGenerate({ voice_id: selectedVoiceId || undefined })
  }, [audioUrl, selectedVoiceId, interestListKey, generating, interestsLoading, onGenerate])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E8] via-[#FFF8F0] to-[#FFEFE0] relative">
      <div className="absolute top-16 -right-12 w-56 h-56 rounded-full bg-gradient-to-br from-[#FFD56B]/25 to-[#FFB84D]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute bottom-24 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-[#E0F5ED]/30 to-[#B8E8D4]/20 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute top-1/3 left-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-[#F0E8FF]/20 to-[#DDD0FF]/15 blur-3xl pointer-events-none -translate-x-1/2" aria-hidden />

      <div className="px-6 pt-10 pb-8 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-amber-700 transition-colors"
        >
          <ChevronLeftIcon className="w-[18px] h-[18px]" />
          Back to routes
        </button>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#222222] tracking-tight">
            Sound for your ride
          </h1>
          <p className="text-sm text-amber-800/80 mt-1">
            {routeSummary || 'Selected route'}
            {durationMinutes != null && !Number.isNaN(durationMinutes) && (
              <> · {formatMinutes(durationMinutes)}</>
            )}
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(180,83,9,0.12)] border border-amber-100 p-6 mb-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">Interests</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {interestList.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-900 border border-amber-200"
              >
                {interest.replace(/[-_]/g, ' ')}
                {onInterestsChange && (
                  <button
                    type="button"
                    onClick={() => onInterestsChange(interestList.filter((i) => i !== interest))}
                    className="w-4 h-4 rounded-full hover:bg-amber-200 flex items-center justify-center text-amber-700"
                    aria-label={`Remove ${interest}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {onInterestsChange && interestList.length < MAX_INTERESTS && (
            <div className="flex gap-2 mb-3">
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
                placeholder="Add interest…"
                className="flex-1 rounded-lg border border-amber-200 px-3 py-2.5 text-sm text-[#222222] placeholder:text-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300"
              />
              <button
                type="button"
                onClick={() => {
                  const v = newInterestInput.trim().replace(/\s+/g, '-').toLowerCase()
                  if (v && !interestList.includes(v)) onInterestsChange([...interestList, v])
                  setNewInterestInput('')
                }}
                className="px-4 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 shadow-sm"
              >
                Add
              </button>
            </div>
          )}
          {onInterestsChange && (
            <button
              type="button"
              onClick={() => setShowInterestSuggestions((s) => !s)}
              className="text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800 mb-4"
            >
              {showInterestSuggestions ? 'Hide suggestions' : 'Suggest interests'}
            </button>
          )}
          {showInterestSuggestions && (
            interestSuggestionsLoading ? (
              <p className="text-sm text-amber-700/80 mb-4">Loading…</p>
            ) : interestSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
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
                      className="px-3 py-1.5 rounded-full text-sm font-medium border border-amber-200 text-amber-900 bg-amber-50 hover:bg-amber-100"
                    >
                      {s.replace(/-/g, ' ')}
                    </button>
                  ))}
              </div>
            ) : null
          )}

          <div className="pt-5 border-t border-amber-100">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">Topic & voice</p>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => onTopicChange?.(e.target.value)}
                placeholder="What should this episode be about?"
                className="flex-1 rounded-lg border border-amber-200 px-3 py-2.5 text-sm text-[#222222] placeholder:text-amber-600/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300"
              />
              {voices.length > 0 && (
                <select
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="sm:w-36 rounded-lg border border-amber-200 px-3 py-2.5 text-sm text-[#222222] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-300"
                >
                  <option value="">Default voice</option>
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-700">
            {errorMessage}
          </div>
        )}

        {!audioUrl ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                lastGeneratedVoiceRef.current = selectedVoiceId
                lastGeneratedInterestsKeyRef.current = interestListKey
                onGenerate({ voice_id: selectedVoiceId || undefined })
              }}
              disabled={!topic || generating}
              className={`
                w-full h-14 rounded-xl font-semibold text-base transition-all
                ${(!topic || generating)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/25 active:scale-[0.99]'}
              `}
            >
              {generating ? 'Generating…' : 'Generate podcast'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!apiBaseNorm || generating) return
                try {
                  const res = await fetch(`${apiBaseNorm}/api/podcast/suggest-topics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      interests: interestList,
                      route_summary: routeSummary,
                      duration_minutes: durationMinutes ?? 10,
                      feeling_lucky: true,
                    }),
                  })
                  const data = await res.json()
                  if (Array.isArray(data?.suggestions) && data.suggestions[0]) {
                    onTopicChange?.(data.suggestions[0])
                  }
                } catch {
                  // ignore
                }
              }}
              disabled={generating}
              className="w-full h-12 rounded-xl font-semibold text-sm border-2 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              I'm feeling lucky
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onListenNow}
              className="w-full h-14 rounded-xl font-semibold text-base bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/25 active:scale-[0.99] transition-all"
            >
              Listen now
            </button>
            <button
              type="button"
              onClick={onClearPodcast}
              className="w-full h-12 rounded-xl font-semibold text-sm border-2 border-amber-200 text-amber-800 bg-white hover:bg-amber-50 transition-colors"
            >
              Generate different podcast
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
