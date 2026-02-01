# Lovable: Ride Screen Redesign

Use this doc + the referenced code so Lovable can redesign the **ride** (commute) tab. The ride screen is the main planning flow: destination → quick picks → origin → schedule → find routes → route list → select route → podcast choice.

---

## 1. What to give Lovable

- **This file:** `mira/docs/LOVABLE_RIDE_SCREEN.md`
- **Ride UI code:** The ride screen is **inline in `mira/frontend/src/App.jsx`** (no separate component). Give Lovable:
  - **Ride block:** Lines **823–1068** (the `{activeTab === 'ride' && ( ... )}` block).
  - **Supporting pieces in the same file:**
    - **StationInput:** Lines **82–179** (station search input with dropdown).
    - **RouteOption:** Lines **224–290** (single route card).
    - **Helpers:** `selectedLabel` (78–80), `formatTime` (181–184), `todayStr` (292–296), `nowTimeStr` (297–300), **HVV_LINE_COLORS + getLineStyle** (184–222).
- **Env:** Ride screen uses `API_BASE` (from `VITE_API_URL`); backend base URL for `/api/routes` and `/api/stations`.

Lovable can **redesign layout, copy, and visuals** as long as the **props/contract below** is preserved so the rest of the app keeps working.

---

## 2. Props / contract (if you extract a component)

If you first extract a `RideScreen` component, use this contract so App.jsx can plug it in.

**Props the parent (App) provides:**

| Prop | Type | Description |
|------||--------|
| `startQuery` | string | Current "from" input value |
| `setStartQuery` | function | Set "from" value |
| `endQuery` | string | Current "to" input value |
| `setEndQuery` | function | Set "to" value |
| `startSelected` | object \| null | Selected station/place for origin (has `id`, `name`, `city`, `combinedName`) |
| `setStartSelected` | function | Set selected origin |
| `endSelected` | object \| null | Selected station/place for destination |
| `setEndSelected` | function | Set selected destination |
| `date` | string | Date for search (YYYY-MM-DD) |
| `setDate` | function | Set date |
| `time` | string | Time for search (HH:mm) |
| `setTime` | function | Set time |
| `timeIsDeparture` | boolean | true = search by departure time, false = arrival |
| `setTimeIsDeparture` | function | Toggle departure/arrival |
| `savedPlaces` | array | `[{ id, label, address }]` for quick destination chips |
| `loading` | boolean | Route search in progress |
| `error` | string \| null | Error message to show |
| `inputsDirty` | boolean | User changed inputs after last search → show "search again" banner |
| `setInputsDirty` | function | Set dirty flag |
| `schedules` | array | Route results (see shape below) |
| `onSubmit` | function | Form submit: search routes (parent calls API and sets `schedules`) |
| `onSelectRoute` | function(schedule) | User picked a route → parent goes to podcast-choice |
| `onUseLiveLocation` | function | "Use live location" → set start to "Current location" (or geocode later) |
| `apiBase` | string | Base URL for API (e.g. `http://localhost:3001`) |

**Station result shape** (from `/api/stations` and used in StationInput):  
`{ id, name, city?, combinedName?, globalId? }`

**Schedule/route shape** (from `/api/routes`):

- `routeId` (optional)
- `time` (number, total minutes)
- `footpathTime` (number, optional, walk minutes)
- `tickets` (optional): `[{ type, price }]`
- `scheduleElements`: array of legs, each:
  - `from`: `{ name, depTime?: { date, time } }`
  - `to`: `{ name, arrTime?: { date, time } }`
  - `line`: `{ name, type?: { shortInfo, longInfo, simpleType } }`

**StationInput** (keep or reimplement with same contract):

- Props: `id`, `placeholder`, `value`, `selected`, `onChange`, `onSelect`, `disabled`, `dark` (boolean), `variant` (optional).
- Fetches: `GET ${apiBase}/api/stations?q=...` (debounced), shows dropdown of results; `onSelect(result)` when user picks one.

**RouteOption** (keep or reimplement):

- Props: `schedule` (object above), `index` (optional), `onSelect` (function(schedule)).
- Renders: duration, walk time, list of legs (line badge + "From → To" + time range), optional ticket price. Clicking the card calls `onSelect(schedule)`.

---

## 3. API used by the ride screen

- **POST `/api/routes`**  
  Body: `{ start, end, time: { date, time }, timeIsDeparture, numberOfSchedules: 5 }`  
  - `start` / `end`: either the selected station object (with `id`) or a string (e.g. address).  
  Response: `{ schedules: [...] }` (array of route objects as above).

- **GET `/api/stations?q=...`**  
  Used by StationInput for search. Response: `{ results: [...] }` (array of station objects).

---

## 4. UI sections (current structure)

Lovable can reorder, restyle, or rename; this is the current flow:

1. **Where are you going?** – Destination input (StationInput), placeholder "Where to?"
2. **Quick selections** – Chips: saved places or fallbacks (e.g. Hamburg Hbf, Jungfernstieg, Altona, Harburg). Click sets destination text.
3. **Starting from** – Origin StationInput ("Current location") + "Use live location" button (compass icon) + swap start/end button.
4. **Schedule** – Toggle: Departure / Arrival; date input; time input.
5. **Find routes** – Submit button (triggers search).
6. **Error** – Shown if API fails.
7. **Loading** – Skeleton list while searching.
8. **Inputs changed** – Banner when user edits after a search: "Inputs changed — search again to update routes."
9. **Available routes** – List of RouteOption cards; tapping one calls `onSelectRoute(schedule)`.

---

## 5. Styling / design tokens

- **Tailwind** is used; config in `mira/frontend/tailwind.config.js`.
- **Colors:** `primary` (#18181b), `background-light` (#FFF9F2), `accent` (#FCD34D), `mint` (#D1FAE5), `pinky` (#FCE7F3), `card-light` (white).
- **Shadow:** `shadow-ios` (soft card shadow).
- **Layout:** Vertical timeline with circular step icons (destination = pinky, quick = accent, start = mint, schedule = primary). Max width `max-w-md`, padding `px-6`, bottom padding for nav `pb-40`.
- **No header** on the ride tab (header is shown on other tabs only).

---

## 6. After Lovable redesign

- Replace the ride block in `App.jsx` (lines 823–1068) with the new JSX, **or** mount a new `<RideScreen ... />` with the props from §2.
- Keep the same callbacks and state names so `handleSubmit`, `handleSelectRoute`, `handleUseLiveLocation`, `swapStartEnd`, and `setInputsDirty` still work.
- Ensure StationInput still calls the same `onSelect`/`onChange` and RouteOption still calls `onSelect(schedule)` so navigation to podcast-choice and route data stay correct.
