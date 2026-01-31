import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

function formatTime(t) {
  if (!t) return '—'
  return [t.date, t.time].filter(Boolean).join(' ')
}

function RouteOption({ schedule, index }) {
  const elements = schedule.scheduleElements || []
  const lineType = (line) => line?.type?.shortInfo || line?.type?.longInfo || line?.name || ''

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-medium text-indigo-800">
          Option {index + 1}
        </span>
        <span className="text-slate-500">
          {schedule.time} min
          {schedule.footpathTime > 0 && ` • ${schedule.footpathTime} min walk`}
        </span>
      </div>
      <div className="space-y-2">
        {elements.map((el, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="min-w-[2.5rem] rounded bg-slate-100 px-1.5 py-0.5 text-center font-medium text-slate-700">
              {lineType(el.line)}
            </span>
            <span className="text-slate-600">
              {el.from?.name} → {el.to?.name}
            </span>
            <span className="text-slate-400">
              {formatTime(el.from?.depTime)} – {formatTime(el.to?.arrTime)}
            </span>
          </div>
        ))}
      </div>
      {schedule.tickets?.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          Ticket: {schedule.tickets[0].type} {schedule.tickets[0].price != null && `(€${schedule.tickets[0].price})`}
        </p>
      )}
    </article>
  )
}

export default function App() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [schedules, setSchedules] = useState([])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSchedules([])
    if (!start.trim() || !end.trim()) {
      setError('Please enter both start and end.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: start.trim(),
          end: end.trim(),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">MIRA — Route finder</h1>
          <p className="mt-1 text-slate-600">Enter start and end to see up to 5 route options.</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start" className="mb-1 block text-sm font-medium text-slate-700">
                From
              </label>
              <input
                id="start"
                type="text"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="e.g. Jungfernstieg"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="end" className="mb-1 block text-sm font-medium text-slate-700">
                To
              </label>
              <input
                id="end"
                type="text"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="e.g. Hamburg Hbf"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={loading}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
            >
              {loading ? 'Loading…' : 'Find routes'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {schedules.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">First 5 route options</h2>
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
