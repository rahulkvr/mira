import { useState, useEffect, useRef } from 'react'
import { WelcomeScreen } from './components/WelcomeScreen.jsx'
import { ChooseCityScreen } from './components/ChooseCityScreen.jsx'
import { SavePlacesScreen } from './components/SavePlacesScreen.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''
// Set to true to always show welcome on load (for editing). Set to false and use key below to show once.
const ALWAYS_SHOW_WELCOME = true
const WELCOME_DONE_KEY = 'mira_welcome_done'
const STATIONS_DEBOUNCE_MS = 300

function selectedLabel(selected) {
  return selected ? (selected.combinedName || (selected.city ? `${selected.name}, ${selected.city}` : selected.name)) : ''
}

function StationInput({ id, label, placeholder, value, selected, onChange, onSelect, disabled, dark, variant }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const displayValue = value ?? selectedLabel(selected)

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

function RouteOption({ schedule, index }) {
  const elements = schedule.scheduleElements || []

  return (
    <article className="rounded-3xl border-2 border-[#E8E3DD] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-3 text-[#6B6B6B] text-sm font-medium">
        {schedule.time} min
        {schedule.footpathTime > 0 && ` • ${schedule.footpathTime} min walk`}
      </div>
      <div className="space-y-2">
        {elements.map((el, i) => {
          const style = getLineStyle(el.line)
          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span
                className="min-w-[2.75rem] rounded px-2 py-1 text-center text-sm font-bold text-white"
                style={{ backgroundColor: style.bg, color: style.fg }}
              >
                {style.label}
              </span>
              <span className="text-[#1A1A1A] font-medium">
                {el.from?.name} → {el.to?.name}
              </span>
              <span className="text-[#6B6B6B]">
                {formatTime(el.from?.depTime)} – {formatTime(el.to?.arrTime)}
              </span>
            </div>
          )
        })}
      </div>
      {schedule.tickets?.length > 0 && (
        <p className="mt-2 text-xs text-[#6B6B6B]">
          Ticket: {schedule.tickets[0].type} {schedule.tickets[0].price != null && `(€${schedule.tickets[0].price})`}
        </p>
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
  // currentScreen: 'welcome' | 'city' | 'places' | 'main'
  const [selectedCity, setSelectedCity] = useState('')
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

  const handleWelcomeDone = () => {
    setCurrentScreen('city')
  }

  const handleCityContinue = (city) => {
    setSelectedCity(city)
    setCurrentScreen('places')
  }

  const handlePlacesContinue = () => {
    setCurrentScreen('main')
    if (!ALWAYS_SHOW_WELCOME) try { localStorage.setItem(WELCOME_DONE_KEY, '1') } catch (_) {}
  }

  const startValue = startSelected || startQuery
  const endValue = endSelected || endQuery
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
    return <WelcomeScreen onGetStarted={handleWelcomeDone} />
  }

  if (currentScreen === 'city') {
    return <ChooseCityScreen onContinue={handleCityContinue} />
  }

  if (currentScreen === 'places') {
    return <SavePlacesScreen onContinue={handlePlacesContinue} />
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE] relative overflow-hidden">
      {/* Decorative shape (match Choose City) */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFE6D3] rounded-bl-[80px] opacity-40" aria-hidden />
      <div className="relative z-10 mx-auto max-w-lg px-6 py-12">
        <header className="mb-8">
          <h1 className="text-[32px] leading-[1.2] text-[#1A1A1A]">
            Where are you<br />headed today?
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <StationInput
            id="start"
            label="From"
            placeholder="Starting point"
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
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={swapStartEnd}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#E8E3DD] bg-white text-[#6B6B6B] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A] disabled:opacity-50"
              title="Swap start and destination"
              aria-label="Swap start and destination"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          <StationInput
            id="end"
            label="To"
            placeholder="Drop me here"
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
          <div className="flex flex-nowrap items-center gap-2 pt-1">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              className="min-w-0 flex-1 rounded-3xl border-2 border-[#E8E3DD] bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:border-[#1A1A1A] focus:outline-none"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={loading}
              className="min-w-0 flex-1 rounded-3xl border-2 border-[#E8E3DD] bg-white px-3 py-2.5 text-sm font-medium text-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:border-[#1A1A1A] focus:outline-none"
            />
            <div className="flex shrink-0 rounded-3xl border-2 border-[#E8E3DD] bg-white p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={() => setTimeIsDeparture(true)}
                disabled={loading}
                className={`rounded-3xl px-3 py-2 text-sm font-medium transition whitespace-nowrap ${timeIsDeparture ? 'bg-[#F7D97A] text-[#1A1A1A] shadow-[0_2px_12px_rgba(247,217,122,0.3)]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'}`}
              >
                Departure
              </button>
              <button
                type="button"
                onClick={() => setTimeIsDeparture(false)}
                disabled={loading}
                className={`rounded-3xl px-3 py-2 text-sm font-medium transition whitespace-nowrap ${!timeIsDeparture ? 'bg-[#F7D97A] text-[#1A1A1A] shadow-[0_2px_12px_rgba(247,217,122,0.3)]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'}`}
              >
                Arrival
              </button>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full rounded-full py-4 font-bold transition relative z-10
                ${loading
                  ? 'bg-[#E8E3DD] text-[#6B6B6B] cursor-not-allowed'
                  : 'bg-[#1A1A1A] text-white active:scale-[0.98] hover:opacity-90'}
              `}
            >
              {loading ? 'Loading…' : 'Find routes'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-3xl border-2 border-[#E8E3DD] bg-white px-5 py-4 text-sm text-[#1A1A1A] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {error}
          </div>
        )}

        {schedules.length > 0 && (
          <section className="mt-8">
            <div className="space-y-4">
              {schedules.map((schedule, i) => (
                <RouteOption key={schedule.routeId ?? i} schedule={schedule} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
