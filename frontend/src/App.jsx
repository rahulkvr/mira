import { useState, useEffect, useRef } from 'react'
import { WelcomeScreen } from './components/WelcomeScreen.jsx'
import { SignInScreen } from './components/SignInScreen.jsx'
import { ChooseCityScreen } from './components/ChooseCityScreen.jsx'
import { SavePlacesScreen } from './components/SavePlacesScreen.jsx'
import { EmailScreen } from './components/EmailScreen.jsx'
import { InterestsScreen } from './components/InterestsScreen.jsx'
import { SuccessScreen } from './components/SuccessScreen.jsx'
import { PodcastChoiceScreen } from './components/PodcastChoiceScreen.jsx'
import { PodcastScreen } from './components/PodcastScreen.jsx'
import { PodcastPlayerPage } from './components/PodcastPlayerPage.jsx'
import { PodcastLoadingScreen } from './components/PodcastLoadingScreen.jsx'
import { MicroMasterScreen } from './components/MicroMasterScreen.jsx'
import { AppHeader } from './components/AppHeader.jsx'
import { BottomNavigation } from './components/BottomNavigation.jsx'
import { ExploreTab } from './components/ExploreTab.jsx'
import { ProfileTab } from './components/ProfileTab.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { hasSupabaseConfig, supabase } from './lib/supabase.js'
import { savePodcastAudio } from './lib/podcastCache.js'

const rawApiUrl = import.meta.env.VITE_API_URL || ''
const API_BASE = rawApiUrl && !/^https?:\/\//i.test(rawApiUrl) ? `http://${rawApiUrl}` : rawApiUrl
// Set to true to always show welcome on load (for editing). Set to false and use key below to show once.
const ALWAYS_SHOW_WELCOME = true
const WELCOME_DONE_KEY = 'mira_welcome_done'
const INTERESTS_LOCAL_KEY = 'mira_interests'
const SAVED_PLACES_KEY = 'mira_saved_places'

function loadLocalInterests() {
  try {
    const raw = localStorage.getItem(INTERESTS_LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadLocalSavedPlaces() {
  try {
    const raw = localStorage.getItem(SAVED_PLACES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
const STATIONS_DEBOUNCE_MS = 300
const DEFAULT_PODCAST_MIN = 6

function formatInterestLabel(value) {
  return String(value || '').replace(/[-_]/g, ' ').trim()
}

function suggestedTopic(interests, durationMinutes) {
  const safeDuration = Math.max(1, Math.round(durationMinutes || DEFAULT_PODCAST_MIN))
  const cleaned = (interests || []).map(formatInterestLabel).filter(Boolean)
  const focus = cleaned.slice(0, 2)
  if (focus.length > 0) {
    return `${safeDuration}-minute fun episode on ${focus.join(' and ')}`
  }
  return `${safeDuration}-minute energetic commute companion`
}

function base64ToBlob(base64, contentType) {
  const byteCharacters = atob(base64 || '')
  const byteArrays = []
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }
  return new Blob(byteArrays, { type: contentType })
}

function selectedLabel(selected) {
  return selected ? (selected.combinedName || (selected.city ? `${selected.name}, ${selected.city}` : selected.name)) : ''
}

function StationInput({ id, placeholder, value, selected, onChange, onSelect, disabled, dark, variant }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const selectedRef = useRef(selected)
  const displayValue = value ?? selectedLabel(selected)
  
  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    if (!displayValue.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const label = selectedLabel(selected)
    if (selected && displayValue.trim() === label.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      fetch(`${API_BASE}/api/stations?q=${encodeURIComponent(displayValue.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          setSuggestions(data.results || [])
          if (!selectedRef.current) setOpen(true)
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, STATIONS_DEBOUNCE_MS)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [displayValue, selected])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayLabel = (r) => r.combinedName || (r.city ? `${r.name}, ${r.city}` : r.name)

  const isDestinationPill = dark && variant === 'destination'
  const darkBg = variant === 'destination' ? 'bg-[#E0E0E0]' : 'bg-[#1A1A1A]'
  const darkPlaceholder = isDestinationPill ? 'placeholder-[#6B6B6B]' : 'placeholder-[#6B6B6B]'
  const darkText = isDestinationPill ? 'text-[#1A1A1A]' : 'text-white'
  const pillClass = dark
    ? `w-full rounded-full ${darkBg} py-4 pl-6 pr-4 text-left font-bold ${darkText} ${darkPlaceholder} focus:outline-none`
    : 'w-full rounded-full bg-white border-2 border-[#E8E3DD] py-4 pl-6 pr-4 text-left font-bold text-[#1A1A1A] placeholder:text-[#6B6B6B] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#1A1A1A]'
  const dotClass = isDestinationPill ? 'bg-[#6B6B6B]' : (dark ? 'bg-white' : 'bg-[#6B6B6B]')

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <span className={`absolute left-5 h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <input
          id={id}
          type="text"
          value={displayValue}
          onChange={(e) => { onChange?.(e.target.value); onSelect?.(null) }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`${pillClass} pl-8`}
        />
      </div>
      {loading && (
        <span className={`absolute right-5 top-1/2 -translate-y-1/2 text-xs ${isDestinationPill ? 'text-[#6B6B6B]' : 'text-[#6B6B6B]'}`}>
          Searching…
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-2 w-full overflow-auto rounded-3xl border border-[#E8E3DD] bg-white py-2 shadow-[0_2px_16px_rgba(0,0,0,0.04)] max-h-52">
          {suggestions.map((r) => (
            <li
              key={r.id || r.globalId || r.name}
              className="cursor-pointer px-5 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F3EE]"
              onMouseDown={() => {
                onSelect?.(r)
                setOpen(false)
              }}
            >
              {displayLabel(r)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatTime(t) {
  if (!t) return '—'
  return [t.date, t.time].filter(Boolean).join(' ')
}

// HVV per-line colors (from HVV / Hochbahn / Wikipedia)
const HVV_LINE_COLORS = {
  // U-Bahn Hamburg
  U1: { bg: '#0072bc', fg: '#fff' },
  U2: { bg: '#ed1c24', fg: '#fff' },
  U3: { bg: '#ffde00', fg: '#1a1a1a' },
  U4: { bg: '#00aaad', fg: '#fff' },
  // S-Bahn Hamburg
  S1: { bg: '#00962c', fg: '#fff' },
  S2: { bg: '#b41439', fg: '#fff' },
  S3: { bg: '#54216e', fg: '#fff' },
  S4: { bg: '#0082c8', fg: '#fff' },
  S5: { bg: '#008abd', fg: '#fff' },
  S11: { bg: '#00962c', fg: '#fff' },
  S21: { bg: '#b41439', fg: '#fff' },
  S31: { bg: '#54216e', fg: '#fff' },
}
const BUS_COLOR = { bg: '#E30613', fg: '#fff' }   // HVV MetroBus red
const FERRY_COLOR = { bg: '#006DB2', fg: '#fff' } // Ferry blue
const FALLBACK_COLOR = { bg: '#6B7280', fg: '#fff' }

function getLineStyle(line) {
  const name = (line?.name || '').trim().toUpperCase()
  const shortInfo = (line?.type?.shortInfo || '').toUpperCase()
  const simpleType = line?.type?.simpleType || ''
  const label = line?.name || shortInfo || '—'
  const exact = HVV_LINE_COLORS[name]
  if (exact) return { ...exact, label }
  if (simpleType === 'BUS' || shortInfo === 'BUS' || /^\d+$/.test((line?.name || '').trim())) {
    return { ...BUS_COLOR, label: line?.name || 'Bus' }
  }
  if (simpleType === 'SHIP' || shortInfo === 'F') {
    return { ...FERRY_COLOR, label: line?.name || 'Fähre' }
  }
  return { ...FALLBACK_COLOR, label }
}

function RouteOption({ schedule, index: _index, onSelect }) {
  const elements = schedule.scheduleElements || []
  const totalMin = schedule.time
  const walkMin = schedule.footpathTime || 0
  const ticket = schedule.tickets?.[0]

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(schedule)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(schedule) } }}
      className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 transition-all hover:shadow-xl active:scale-[0.99] cursor-pointer text-left"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xl font-bold text-[#1F1F1F]">{totalMin} min</span>
          </div>
          {walkMin > 0 && (
            <span className="text-sm text-gray-500 border-l border-gray-200 pl-3">{walkMin} min walk</span>
          )}
        </div>
        <svg className="w-5 h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div className="space-y-3">
        {elements.map((el, i) => {
          const style = getLineStyle(el.line)
          const timeRange = el.from?.depTime && el.to?.arrTime ? `${formatTime(el.from.depTime)} – ${formatTime(el.to.arrTime)}` : null
          return (
            <div key={i} className="flex items-center gap-3">
              <span
                className="min-w-[52px] px-2.5 py-1.5 rounded-lg text-center text-xs font-bold text-white shrink-0"
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
      {ticket && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">{ticket.type}</span>
          <span className="text-sm font-semibold text-[#1F1F1F]">
            {ticket.price != null ? `€${ticket.price}` : ''}
          </span>
        </div>
      )}
    </article>
  )
}

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
function nowTimeStr() {
  const d = new Date()
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

export default function App() {
  const { signInWithPassword, signUpWithPassword, user, loading: authLoading } = useAuth()
  const [currentScreen, setCurrentScreen] = useState(() =>
    ALWAYS_SHOW_WELCOME ? 'welcome' : (localStorage.getItem(WELCOME_DONE_KEY) ? 'main' : 'welcome')
  )
  // currentScreen: 'welcome' | 'city' | 'places' | 'email' | 'interests' | 'success' | 'podcast' | 'main'
  const [_selectedCity, setSelectedCity] = useState('')
  const [startQuery, setStartQuery] = useState('')
  const [endQuery, setEndQuery] = useState('')
  const [startSelected, setStartSelected] = useState(null)
  const [endSelected, setEndSelected] = useState(null)
  const [date, setDate] = useState(() => todayStr())
  const [time, setTime] = useState(() => nowTimeStr())
  const [timeIsDeparture, setTimeIsDeparture] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signInError, setSignInError] = useState(null)
  const [signUpError, setSignUpError] = useState(null)
  const [interestsError, setInterestsError] = useState('')
  const [interestsSaving, setInterestsSaving] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [activeTab, setActiveTab] = useState('ride')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [userInterests, setUserInterests] = useState(loadLocalInterests)
  const [interestsLoading, setInterestsLoading] = useState(false)
  const [podcastTopic, setPodcastTopic] = useState('')
  const [podcastScript, setPodcastScript] = useState('')
  const [podcastAudioUrl, setPodcastAudioUrl] = useState('')
  const [podcastError, setPodcastError] = useState('')
  const [podcastLoading, setPodcastLoading] = useState(false)
  const [podcastOfflineReady, setPodcastOfflineReady] = useState(false)
  const [savedPlaces, setSavedPlaces] = useState(loadLocalSavedPlaces)
  const [inputsDirty, setInputsDirty] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (user) {
      if (currentScreen === 'welcome' || currentScreen === 'signin') {
        setCurrentScreen('main')
      }
      return
    }
    // Do not redirect guests from main to welcome: they may have completed onboarding
    // (e.g. skipped email) and clicked "Start planning a ride"; allow them to stay on main.
  }, [authLoading, user, currentScreen])

  useEffect(() => {
    if (!podcastAudioUrl) return () => {}
    return () => {
      URL.revokeObjectURL(podcastAudioUrl)
    }
  }, [podcastAudioUrl])

  useEffect(() => {
    if (!selectedSchedule) return
    setPodcastError('')
    setPodcastScript('')
    setPodcastAudioUrl('')
    setPodcastOfflineReady(false)
    setPodcastTopic('')
  }, [selectedSchedule])

  useEffect(() => {
    if (currentScreen !== 'podcast') return
    if (!user || !hasSupabaseConfig || !supabase) {
      setUserInterests([])
      return
    }
    setInterestsLoading(true)
    supabase
      .from('user_preferences')
      .select('interests')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setUserInterests([])
          return
        }
        setUserInterests(Array.isArray(data?.interests) ? data.interests : [])
      })
      .finally(() => setInterestsLoading(false))
  }, [currentScreen, user])

  useEffect(() => {
    if (currentScreen !== 'podcast') return
    if (!selectedSchedule) return
    if (podcastTopic.trim()) return
    setPodcastTopic(suggestedTopic(userInterests, selectedSchedule?.time))
  }, [currentScreen, selectedSchedule, userInterests, podcastTopic])

  const handleWelcomeDone = () => {
    setCurrentScreen('city')
  }

  const handleCityBack = () => {
    setCurrentScreen('welcome')
  }

  const handleCityContinue = (city) => {
    setSelectedCity(city)
    setCurrentScreen('places')
  }

  const handlePlacesBack = () => {
    setCurrentScreen('city')
  }

  const handlePlacesContinue = (places) => {
    setSavedPlaces(places || [])
    try {
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places || []))
    } catch {
      // ignore
    }
    setCurrentScreen('email')
  }

  const handleEmailBack = () => {
    setCurrentScreen('places')
  }

  const handleEmailContinue = async ({ email, password, displayName }) => {
    setSignUpError(null)
    if (!hasSupabaseConfig || !supabase) {
      setCurrentScreen('interests')
      return
    }
    const { error: authError } = await signUpWithPassword({ email, password, displayName })
    if (authError) {
      setSignUpError(authError.message || 'Could not sign up. Please try again.')
      return
    }
    setCurrentScreen('interests')
  }

  const handleEmailSkip = () => {
    setCurrentScreen('interests')
  }

  const handleSignIn = () => {
    setCurrentScreen('signin')
  }

  const handleSignInSubmit = async (email, password) => {
    setSignInError(null)
    const { error: authError } = await signInWithPassword({ email, password })
    if (authError) {
      setSignInError(authError.message || 'Could not sign in. Please try again.')
      return
    }
    setCurrentScreen('main')
    if (!ALWAYS_SHOW_WELCOME) {
      try {
        localStorage.setItem(WELCOME_DONE_KEY, '1')
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  const handleSignInBack = () => {
    setCurrentScreen('welcome')
  }

  const handleInterestsBack = () => {
    setCurrentScreen('email')
  }

  const handleInterestsComplete = async (_interests) => {
    setInterestsError('')
    const canSaveToSupabase = user && hasSupabaseConfig && supabase
    if (canSaveToSupabase) {
      setInterestsSaving(true)
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            interests: _interests,
          },
          { onConflict: 'user_id' }
        )
      setInterestsSaving(false)
      if (upsertError) {
        setInterestsError(upsertError.message || 'Could not save interests. Please try again.')
        return
      }
      setCurrentScreen('success')
      return
    }
    // No user or Supabase not configured: save locally and proceed
    try {
      localStorage.setItem(INTERESTS_LOCAL_KEY, JSON.stringify(_interests))
      setUserInterests(_interests)
      setCurrentScreen('success')
    } catch {
      setInterestsError('Could not save interests on this device.')
    }
  }

  const handleSuccessStartRide = () => {
    setCurrentScreen('main')
    if (!ALWAYS_SHOW_WELCOME) {
      try {
        localStorage.setItem(WELCOME_DONE_KEY, '1')
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  const handleSuccessEditPreferences = () => {
    setCurrentScreen('city')
  }

  const handleSelectRoute = (schedule) => {
    setSelectedSchedule(schedule)
    setCurrentScreen('podcast-choice')
  }

  const handlePodcastChoiceBack = () => {
    setCurrentScreen('main')
  }

  const handlePodcastBack = () => {
    setCurrentScreen('podcast-choice')
  }

  const handleMicroMasterBack = () => {
    setCurrentScreen('podcast-choice')
  }

  const handleClearPodcast = () => {
    if (podcastAudioUrl) URL.revokeObjectURL(podcastAudioUrl)
    setPodcastAudioUrl('')
    setPodcastScript('')
    setPodcastTopic(suggestedTopic(userInterests, selectedSchedule?.time))
    setPodcastError('')
    setPodcastOfflineReady(false)
  }

  const startLocationLabel = selectedLabel(startSelected) || startQuery.trim() || 'Current location'
  const endLocationLabel = selectedLabel(endSelected) || endQuery.trim() || 'Destination'

  const handleGeneratePodcast = async () => {
    if (!selectedSchedule) return
    setPodcastError('')
    setPodcastLoading(true)
    setCurrentScreen('podcast-loading')

    const durationMinutes = Math.max(1, Math.round(selectedSchedule.time || DEFAULT_PODCAST_MIN))
    const elements = selectedSchedule.scheduleElements || []
    const scheduleElements = elements.map((el) => ({
      from_name: el.from?.name ?? '',
      to_name: el.to?.name ?? '',
      line_name: el.line?.name ?? '',
      line_type_short: el.line?.type?.shortInfo ?? el.line?.type?.longInfo ?? 'transit',
      dep_time: el.from?.depTime ?? null,
      arr_time: el.to?.arrTime ?? null,
    }))
    const journey = {
      start_name: startLocationLabel,
      dest_name: endLocationLabel,
      schedule_elements: scheduleElements,
      total_minutes: durationMinutes,
      local_time: new Date().toISOString(),
    }
    const payload = {
      interests: userInterests,
      route_duration_minutes: durationMinutes,
      topic_override: podcastTopic?.trim(),
      journey,
    }

    try {
      const res = await fetch(`${API_BASE}/api/podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setPodcastError(data.error || 'Could not generate podcast. Please try again.')
        setCurrentScreen('podcast')
        setPodcastLoading(false)
        return
      }
      const audioBlob = base64ToBlob(data.audio_base64, 'audio/mpeg')
      const audioUrl = URL.createObjectURL(audioBlob)
      setPodcastAudioUrl(audioUrl)
      setPodcastScript(data.script || '')
      setPodcastTopic(data.topic || podcastTopic)

      let cacheKey = `local-${Date.now()}`
      if (user && hasSupabaseConfig && supabase) {
        const routeData = {
          schedule: selectedSchedule,
          duration_minutes: durationMinutes,
          podcast: {
            topic: data.topic || podcastTopic,
            interests: userInterests,
            generated_at: new Date().toISOString(),
          },
        }
        const { data: inserted, error } = await supabase
          .from('journeys')
          .insert({
            user_id: user.id,
            start_location: startLocationLabel,
            end_location: endLocationLabel,
            route_data: routeData,
          })
          .select('id')
          .single()

        if (!error && inserted?.id) {
          cacheKey = inserted.id
        }
      }

      try {
        await savePodcastAudio(cacheKey, audioBlob)
        setPodcastOfflineReady(true)
      } catch {
        setPodcastOfflineReady(false)
      }

      setCurrentScreen('podcast-player')
    } catch (err) {
      setPodcastError(err.message || 'Network error. Please try again.')
      setCurrentScreen('podcast')
    } finally {
      setPodcastLoading(false)
    }
  }

  const hasStart = (startSelected && startSelected.id) || startQuery.trim()
  const hasEnd = (endSelected && endSelected.id) || endQuery.trim()

  function swapStartEnd() {
    setStartQuery(endQuery)
    setEndQuery(startQuery)
    setStartSelected(endSelected)
    setEndSelected(startSelected)
  }

  function handleUseLiveLocation() {
    setStartQuery('Current location')
    setStartSelected(null)
    if (schedules.length > 0) setInputsDirty(true)
    // Optional: could call geolocation + reverse geocode to a station here
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSchedules([])
    setInputsDirty(false)
    if (!hasStart || !hasEnd) {
      setError('Please enter and select both start and end.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startSelected?.id ? startSelected : startQuery.trim(),
          end: endSelected?.id ? endSelected : endQuery.trim(),
          time: { date, time },
          timeIsDeparture,
          numberOfSchedules: 5,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || data.errorText || 'Could not load routes.')
        return
      }
      const firstFive = (data.schedules || []).slice(0, 5)
      setSchedules(firstFive)
    } catch (err) {
      setError(err.message || 'Network error. Is the backend running on port 3001?')
    } finally {
      setLoading(false)
    }
  }

  if (currentScreen === 'welcome') {
    return <WelcomeScreen onGetStarted={handleWelcomeDone} onSignIn={handleSignIn} />
  }

  if (currentScreen === 'signin') {
    return <SignInScreen onSignIn={handleSignInSubmit} onBack={handleSignInBack} errorMessage={signInError} />
  }

  if (currentScreen === 'city') {
    return <ChooseCityScreen onContinue={handleCityContinue} onBack={handleCityBack} />
  }

  if (currentScreen === 'places') {
    return (
      <SavePlacesScreen
        onContinue={handlePlacesContinue}
        onBack={handlePlacesBack}
        city={_selectedCity || 'Hamburg'}
      />
    )
  }

  if (currentScreen === 'email') {
    return (
      <EmailScreen
        onContinue={handleEmailContinue}
        onSkip={handleEmailSkip}
        onBack={handleEmailBack}
        errorMessage={signUpError}
      />
    )
  }

  if (currentScreen === 'interests') {
    return (
      <InterestsScreen
        onComplete={handleInterestsComplete}
        onBack={handleInterestsBack}
        saving={interestsSaving}
        errorMessage={interestsError}
      />
    )
  }

  const routeStations = (() => {
    if (!selectedSchedule) return []
    const names = new Set()
    const s = selectedSchedule
    if (s.start?.name) names.add(String(s.start.name).trim())
    if (s.dest?.name) names.add(String(s.dest.name).trim())
    ;(s.scheduleElements || []).forEach((el) => {
      if (el.from?.name) names.add(String(el.from.name).trim())
      if (el.to?.name) names.add(String(el.to.name).trim())
    })
    return [...names]
  })()

  if (currentScreen === 'podcast-choice') {
    return (
      <PodcastChoiceScreen
        routeSummary={selectedSchedule ? `${startLocationLabel} → ${endLocationLabel}` : null}
        durationMinutes={selectedSchedule?.time}
        onSelectGeneratePodcast={() => setCurrentScreen('podcast')}
        onSelectMicroMaster={() => setCurrentScreen('micromaster')}
        onBack={handlePodcastChoiceBack}
      />
    )
  }

  if (currentScreen === 'micromaster') {
    return <MicroMasterScreen onBack={handleMicroMasterBack} apiBase={API_BASE} />
  }

  if (currentScreen === 'podcast-loading') {
    return <PodcastLoadingScreen />
  }

  if (currentScreen === 'podcast-player') {
    return (
      <PodcastPlayerPage
        audioUrl={podcastAudioUrl}
        routeSummary={`${startLocationLabel} → ${endLocationLabel}`}
        scheduleElements={selectedSchedule?.scheduleElements ?? []}
        durationMinutes={selectedSchedule?.time}
        routeStations={routeStations}
        apiBase={API_BASE}
        onBack={() => setCurrentScreen('podcast')}
      />
    )
  }

  if (currentScreen === 'podcast') {
    return (
      <PodcastScreen
        onBack={handlePodcastBack}
        topic={podcastTopic}
        onTopicChange={setPodcastTopic}
        onGenerate={handleGeneratePodcast}
        onClearPodcast={handleClearPodcast}
        onListenNow={() => setCurrentScreen('podcast-player')}
        onInterestsChange={setUserInterests}
        generating={podcastLoading}
        errorMessage={podcastError}
        audioUrl={podcastAudioUrl}
        durationMinutes={selectedSchedule?.time}
        interests={interestsLoading ? [] : userInterests}
        routeSummary={`${startLocationLabel} → ${endLocationLabel}`}
        offlineReady={podcastOfflineReady}
        script={podcastScript}
        routeStations={routeStations}
        apiBase={API_BASE}
        scheduleElements={selectedSchedule?.scheduleElements ?? []}
      />
    )
  }

  if (currentScreen === 'success') {
    return (
      <SuccessScreen
        onStartRide={handleSuccessStartRide}
        onEditPreferences={handleSuccessEditPreferences}
      />
    )
  }

  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || ''

  return (
    <div className="min-h-screen bg-background-light font-display">
      {activeTab !== 'ride' && (
        <AppHeader onProfileClick={() => setActiveTab('profile')} userName={displayName} />
      )}
      <div className="pb-24">
        {activeTab === 'ride' && (
          <div className="min-h-screen bg-background-light">
            <main className="w-full max-w-md mx-auto px-6 pb-40 pt-[3.75rem]">
              <form onSubmit={handleSubmit} className="flex flex-col">
                {/* Step 1: Where to? */}
                <div className="border-l-2 border-gray-100 ml-5 pl-10 pb-10 relative">
                  <div className="absolute -left-[21px] top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-pinky text-gray-900" aria-hidden>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <section className="mb-5">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 leading-tight">Where are you going?</h1>
                  </section>
                  <div className="bg-white rounded-2xl p-2 shadow-ios ring-1 ring-gray-100">
                    <label htmlFor="end" className="sr-only">To</label>
                    <div className="relative flex items-center gap-1">
                      <div className="flex-1 min-w-0">
                        <StationInput
                          id="end"
                          placeholder="Where to?"
                        value={endQuery}
                        selected={endSelected}
                        onSelect={(r) => {
                          setEndSelected(r)
                          if (r) setEndQuery(r.combinedName || (r.city ? `${r.name}, ${r.city}` : r.name))
                          if (schedules.length > 0) setInputsDirty(true)
                        }}
                        onChange={(v) => { setEndQuery(v); setEndSelected(null); if (schedules.length > 0) setInputsDirty(true) }}
                        disabled={loading}
                        dark={false}
                      />
                      </div>
                      <span className="p-2 text-gray-400 pointer-events-none shrink-0" aria-hidden>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2: Quick selections */}
                <div className="border-l-2 border-gray-100 ml-5 pl-10 pb-10 relative">
                  <div className="absolute -left-[21px] top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-accent text-gray-900" aria-hidden>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Quick selections</p>
                    <div className="flex flex-wrap gap-2">
                      {(savedPlaces.length > 0 ? savedPlaces.map((p) => ({ id: p.id, label: p.label || p.address, address: p.address })) : [{ id: 'hbf', label: 'Hamburg Hbf' }, { id: 'jungfernstieg', label: 'Jungfernstieg' }, { id: 'altona', label: 'Altona' }, { id: 'harburg', label: 'Harburg' }]).map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => {
                            const value = place.address || place.label
                            setEndQuery(value)
                            setEndSelected(null)
                            if (schedules.length > 0) setInputsDirty(true)
                          }}
                          className="px-3 py-1.5 bg-accent/20 border border-accent/30 text-[11px] font-bold rounded-full text-yellow-800 uppercase tracking-wider hover:shadow-md transition-all cursor-pointer"
                        >
                          {place.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Starting from */}
                <div className="border-l-2 border-gray-100 ml-5 pl-10 pb-10 relative">
                  <div className="absolute -left-[21px] top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-mint text-gray-900" aria-hidden>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-800" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Starting from</label>
                    <div className="bg-white rounded-2xl p-2 shadow-ios ring-1 ring-gray-100">
                      <div className="relative flex items-center flex-wrap gap-2">
                        <div className="flex-1 min-w-0">
                          <StationInput
                            id="start"
                            placeholder="Current location"
                            value={startQuery}
                            selected={startSelected}
                            onSelect={(r) => {
                              setStartSelected(r)
                              if (r) setStartQuery(r.combinedName || (r.city ? `${r.name}, ${r.city}` : r.name))
                              if (schedules.length > 0) setInputsDirty(true)
                            }}
                            onChange={(v) => { setStartQuery(v); setStartSelected(null); if (schedules.length > 0) setInputsDirty(true) }}
                            disabled={loading}
                            dark={false}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleUseLiveLocation}
                          className="p-2 rounded-full text-blue-500 hover:bg-blue-50 shrink-0 transition-colors"
                          aria-label="Use live location"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={swapStartEnd}
                      disabled={loading}
                      className="self-start p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      title="Swap start and destination"
                      aria-label="Swap start and destination"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                    </button>
                  </div>
                </div>

                {/* Step 4: Schedule */}
                <div className="border-l-2 border-gray-100 ml-5 pl-10 pb-6 relative last:border-l-0">
                  <div className="absolute -left-[21px] top-0 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-primary text-white" aria-hidden>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">Schedule</label>
                      <div className="bg-white p-1 rounded-full shadow-ios flex scale-90 origin-right shrink-0">
                        <button
                          type="button"
                          onClick={() => { setTimeIsDeparture(true); if (schedules.length > 0) setInputsDirty(true) }}
                          disabled={loading}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${timeIsDeparture ? 'bg-primary text-white' : 'bg-transparent text-gray-400'}`}
                        >
                          Departure
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTimeIsDeparture(false); if (schedules.length > 0) setInputsDirty(true) }}
                          disabled={loading}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!timeIsDeparture ? 'bg-primary text-white' : 'bg-transparent text-gray-400'}`}
                        >
                          Arrival
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white p-2 rounded-2xl shadow-ios ring-1 ring-gray-100 flex items-center px-4 relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => { setDate(e.target.value); if (schedules.length > 0) setInputsDirty(true) }}
                          disabled={loading}
                          className="w-full bg-transparent border-none py-3 text-sm font-bold text-gray-900 focus:ring-0 outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <span className="text-gray-400 pointer-events-none ml-2" aria-hidden>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-2xl shadow-ios ring-1 ring-gray-100 flex items-center px-4 relative">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => { setTime(e.target.value); if (schedules.length > 0) setInputsDirty(true) }}
                          disabled={loading}
                          className="w-full bg-transparent border-none py-3 text-sm font-bold text-gray-900 focus:ring-0 outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <span className="text-gray-400 pointer-events-none ml-2" aria-hidden>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-6 rounded-3xl font-black text-xl uppercase tracking-widest transition-transform shadow-2xl shadow-black/20 active:scale-[0.98] ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white'}`}
                  >
                    {loading ? 'Searching…' : 'Find routes'}
                  </button>
                </div>
              </form>

                {error && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Loading skeleton — Commute Companion style */}
                {loading && (
                  <section className="space-y-4 pb-24">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-32 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-20 bg-gray-200 rounded-lg animate-pulse" />
                            <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse" />
                          </div>
                          <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-3">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="flex items-center gap-3">
                              <div className="h-8 w-14 bg-gray-200 rounded-lg animate-pulse" />
                              <div className="h-4 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                              <div className="h-4 w-8 bg-gray-200 rounded-lg animate-pulse" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {/* Inputs changed banner — Commute Companion style */}
                {inputsDirty && schedules.length > 0 && (
                  <div className="mb-4 flex items-center gap-3 p-3 rounded-2xl bg-[#FFF5D6] border border-[#FFE9A8]">
                    <svg className="w-[18px] h-[18px] text-[#1F1F1F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-sm text-[#1F1F1F]">Inputs changed — search again to update routes</span>
                  </div>
                )}

                {/* Route results — only when not dirty */}
                {schedules.length > 0 && !loading && !inputsDirty && (
                  <section className="space-y-4 pb-24">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#1F1F1F]">Available routes</h2>
                      <span className="text-sm text-gray-500">{schedules.length} options</span>
                    </div>
                    {schedules.map((schedule, i) => (
                      <RouteOption
                        key={schedule.routeId ?? i}
                        schedule={schedule}
                        index={i}
                        onSelect={handleSelectRoute}
                      />
                    ))}
                  </section>
                )}
            </main>
            </div>
        )}
        {activeTab === 'explore' && <ExploreTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
