import { useState, useEffect, useRef } from 'react'
import { WelcomeScreen } from './components/WelcomeScreen.jsx'
import { SignInScreen } from './components/SignInScreen.jsx'
import { ChooseCityScreen } from './components/ChooseCityScreen.jsx'
import { SavePlacesScreen } from './components/SavePlacesScreen.jsx'
import { EmailScreen } from './components/EmailScreen.jsx'
import { InterestsScreen } from './components/InterestsScreen.jsx'
import { SuccessScreen } from './components/SuccessScreen.jsx'
import { AppHeader } from './components/AppHeader.jsx'
import { BottomNavigation } from './components/BottomNavigation.jsx'
import { ExploreTab } from './components/ExploreTab.jsx'
import { ProfileTab } from './components/ProfileTab.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''
// Set to true to always show welcome on load (for editing). Set to false and use key below to show once.
const ALWAYS_SHOW_WELCOME = true
const WELCOME_DONE_KEY = 'mira_welcome_done'
const STATIONS_DEBOUNCE_MS = 300

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

function RouteOption({ schedule }) {
  const elements = schedule.scheduleElements || []
  const totalMin = schedule.time
  const walkMin = schedule.footpathTime || 0
  const ticket = schedule.tickets?.[0]

  return (
    <article className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 transition-all hover:shadow-xl active:scale-[0.99]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xl font-bold text-[#1F1F1F]">{totalMin} min</span>
          </div>
          {walkMin > 0 && (
            <span className="text-sm text-gray-500 border-l border-gray-200 pl-3">{walkMin} min walk</span>
          )}
        </div>
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
  const [currentScreen, setCurrentScreen] = useState(() =>
    ALWAYS_SHOW_WELCOME ? 'welcome' : (localStorage.getItem(WELCOME_DONE_KEY) ? 'main' : 'welcome')
  )
  // currentScreen: 'welcome' | 'city' | 'places' | 'email' | 'interests' | 'success' | 'main'
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
  const [schedules, setSchedules] = useState([])
  const [activeTab, setActiveTab] = useState('ride')

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

  const handlePlacesContinue = (_places) => {
    setCurrentScreen('email')
  }

  const handleEmailBack = () => {
    setCurrentScreen('places')
  }

  const handleEmailContinue = (_email, _password) => {
    setCurrentScreen('interests')
  }

  const handleEmailSkip = () => {
    setCurrentScreen('interests')
  }

  const handleSignIn = () => {
    setCurrentScreen('signin')
  }

  const handleSignInSubmit = (_email, _password) => {
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

  const handleInterestsComplete = (_interests) => {
    setCurrentScreen('success')
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

  const hasStart = (startSelected && startSelected.id) || startQuery.trim()
  const hasEnd = (endSelected && endSelected.id) || endQuery.trim()

  function swapStartEnd() {
    setStartQuery(endQuery)
    setEndQuery(startQuery)
    setStartSelected(endSelected)
    setEndSelected(startSelected)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSchedules([])
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
    return <SignInScreen onSignIn={handleSignInSubmit} onBack={handleSignInBack} />
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
      />
    )
  }

  if (currentScreen === 'interests') {
    return (
      <InterestsScreen
        onComplete={handleInterestsComplete}
        onBack={handleInterestsBack}
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

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <AppHeader onProfileClick={() => setActiveTab('profile')} />
      <div className="pb-24">
        {activeTab === 'ride' && (
          <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-[#FFFAF5] to-[#FFFDF9] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-[#FFE9A8]/30 to-[#FFCF6B]/20 blur-3xl pointer-events-none" aria-hidden />
            <div className="absolute top-40 -left-20 w-48 h-48 rounded-full bg-gradient-to-br from-[#B5E8D4]/25 to-[#9BC4DC]/15 blur-3xl pointer-events-none" aria-hidden />

            <div className="px-5 pt-4 pb-6 relative z-10">
              <header className="mb-6">
                <h1 className="text-2xl font-bold text-[#1F1F1F]">Where are you going?</h1>
              </header>

              {/* Departure/Arrival toggle — Commute Companion style */}
              <div className="mb-5">
                <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
                  <button
                    type="button"
                    onClick={() => setTimeIsDeparture(true)}
                    disabled={loading}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${timeIsDeparture ? 'bg-[#1F1F1F] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Departure
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeIsDeparture(false)}
                    disabled={loading}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${!timeIsDeparture ? 'bg-[#1F1F1F] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Arrival
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-0">
                {/* Route input card — Commute Companion style */}
                <div className="rounded-3xl bg-white shadow-lg border border-gray-50 p-5 space-y-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E0F5ED] to-[#B8E8D4] flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1F1F1F]" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">From</p>
                      <StationInput
                        id="start"
                        placeholder="Current location"
                        value={startQuery}
                        selected={startSelected}
                        onSelect={(r) => {
                          setStartSelected(r)
                          setStartQuery(r.combinedName || (r.city ? `${r.name}, ${r.city}` : r.name))
                        }}
                        onChange={(v) => { setStartQuery(v); setStartSelected(null) }}
                        disabled={loading}
                        dark={false}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-1">
                    <div className="w-10 flex justify-center shrink-0">
                      <div className="flex flex-col gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300 block" />
                        <span className="w-1 h-1 rounded-full bg-gray-300 block" />
                        <span className="w-1 h-1 rounded-full bg-gray-300 block" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFE4EC] to-[#FFCCD8] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#1F1F1F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">To</p>
                      <StationInput
                        id="end"
                        placeholder="Where to?"
                        value={endQuery}
                        selected={endSelected}
                        onSelect={(r) => {
                          setEndSelected(r)
                          setEndQuery(r.combinedName || (r.city ? `${r.name}, ${r.city}` : r.name))
                        }}
                        onChange={(v) => { setEndQuery(v); setEndSelected(null) }}
                        disabled={loading}
                        dark
                        variant="destination"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={swapStartEnd}
                      disabled={loading}
                      className="shrink-0 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#1F1F1F] transition-colors"
                      title="Swap start and destination"
                      aria-label="Swap start and destination"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* Quick place chips */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {['Hamburg Hbf', 'Jungfernstieg', 'Altona', 'Harburg'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setEndQuery(label)
                          setEndSelected(null)
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-br from-[#FFF5D6] to-[#FFE9A8] text-[#6B5900] hover:shadow-md transition-all"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & time row */}
                <div className="flex flex-nowrap items-center gap-2 mb-5">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1F1F1F] shadow-sm focus:border-[#FFD56B] focus:ring-2 focus:ring-[#FFD56B] focus:ring-offset-2 focus:outline-none"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-[#1F1F1F] shadow-sm focus:border-[#FFD56B] focus:ring-2 focus:ring-[#FFD56B] focus:ring-offset-2 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full h-14 rounded-full font-semibold text-base transition-all
                    ${loading ? 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed' : 'bg-[#1F1F1F] text-white shadow-lg hover:bg-[#2A2A2A] hover:shadow-xl active:scale-[0.98]'}
                  `}
                >
                  {loading ? 'Searching…' : 'Find routes'}
                </button>
              </form>

                {error && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {schedules.length > 0 && (
                  <section className="space-y-4 pb-24">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#1F1F1F]">Available routes</h2>
                      <span className="text-sm text-gray-500">{schedules.length} options</span>
                    </div>
                    {schedules.map((schedule, i) => (
                      <RouteOption key={schedule.routeId ?? i} schedule={schedule} index={i} />
                    ))}
                  </section>
                )}
              </div>
            </div>
        )}
        {activeTab === 'explore' && <ExploreTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
