# MIRA Backend

Node.js/Express backend for MIRA. Fetches transit routes from the **Geofox GTI API** (HVV) using start and end locations.

---

## Requests you can send

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check. |
| GET | `/api/stations?q=` | Station/stop autocomplete (HVV). |
| GET | `/api/addresses?q=` | Address autocomplete (Nominatim, exact addresses e.g. Home/Work). |
| POST | `/api/routes` | Get transit route options between two locations. |
| GET / POST | `/api/announcements` | Get HVV transit announcements (disruptions, messages). |

### POST `/api/routes`

Start and end can be **station names** (resolved via HVV) or **full addresses** (geocoded via Nominatim). Only resolved stations or coordinates are sent to Geofox; the exact address text is never sent.

**Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start` | string or `{ name, city? }` | yes | Start: station name (e.g. `"Jungfernstieg"`) or full address (e.g. `"Musterstraße 42, Hamburg"`) |
| `end` | string or `{ name, city? }` | yes | End: station name or full address |
| `time` | `{ date, time }` | no | When to travel. Default: now. `date`: `YYYY-MM-DD` or `DD.MM.YYYY`, `time`: `HH:mm` |
| `timeIsDeparture` | boolean | no | `true` = time is departure (default), `false` = time is arrival |
| `numberOfSchedules` | number | no | How many route options to return (default 10, max 20). |

**Example:**

```bash
curl -X POST http://localhost:3001/api/routes \
  -H "Content-Type: application/json" \
  -d '{"start":"Jungfernstieg","end":"Hamburg Hbf"}'
```

**Success response (200):** `{ "success": true, "returnCode": "OK", "realtimeAffected": false, "schedules": [ ... ] }`

**Errors:** `400` (missing/invalid start or end), `422` (no routes found), `503` (Geofox API/credentials issue).

---

### GET `/api/addresses`

Address autocomplete for exact addresses (e.g. Home/Work). Uses Nominatim (OpenStreetMap). No auth.

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (min 3 chars). |

**Example:** `GET /api/addresses?q=Mönckebergstraße%207`

**Success response (200):** `{ "results": [ { "display_name": "...", "lat": "...", "lon": "..." }, ... ] }`

---

### GET / POST `/api/announcements`

Returns HVV transit announcements (disruptions, service messages). Default time range: now to 7 days ahead.

**GET** — optional query params:

| Param | Type | Description |
|-------|------|-------------|
| `from` | string (ISO date-time) | Start of time range. |
| `to` | string (ISO date-time) | End of time range. |

**POST** — optional body (JSON):

| Field | Type | Description |
|-------|------|-------------|
| `timeRange` | `{ begin, end }` | ISO date-time range. |
| `names` | string[] | Filter by announcement names. |
| `filterPlanned` | `"NO_FILTER"` \| `"ONLY_PLANNED"` \| `"ONLY_UNPLANNED"` | Filter planned vs unplanned. |
| `full` | boolean | Return full announcement details. |
| `showBroadcastRelevant` | boolean | Only broadcast-relevant. |

**Example:**

```bash
curl http://localhost:3001/api/announcements
```

**Success response (200):** `{ "success": true, "returnCode": "OK", "announcements": [ ... ], "lastUpdate": "..." }`

Each announcement can include `id`, `summary`, `description`, `locations`, `publication`, `validities`, `lastModified`, `planned`, `reason`, `links`, etc.

**Errors:** `422` (API returned non-OK), `503` (Geofox unavailable).

---

## What you get back (route data)

Each item in `schedules` is one route option. You can use it for:

- **Journey blocks** — `scheduleElements` = legs (e.g. S1 from Jungfernstieg to Hamburg Hbf). Each has `from`/`to` (stations + `depTime`/`arrTime`) and `line` (name, direction, type: S-Bahn, U-Bahn, Bus, etc.).
- **Total duration** — `time` (minutes) and/or derive from first dep and last arr in `scheduleElements`.
- **Stations and lines** — For MIRA: “By the time we pull into Hamburg Hbf…” or “You’re on the S1 toward Hamburg Airport.”
- **Tickets** — `tickets[]` with price, type (e.g. Einzelticket HVV), level (e.g. Kurzstrecke).

**Example schedule (one option):**

```json
{
  "routeId": 0,
  "start": { "name": "Jungfernstieg", "city": "Hamburg", "id": "Master:11950", "type": "STATION", "coordinate": { "x": 9.99, "y": 53.55 } },
  "dest": { "name": "Hamburg Hbf", "city": "Hamburg", "id": "Master:10950", "type": "STATION", "coordinate": { "x": 10.00, "y": 53.55 } },
  "time": 2,
  "footpathTime": 0,
  "tickets": [{ "price": 2.1, "type": "Einzelticket HVV (EUR)", "level": "Kurzstrecke", "tariff": "HVV" }],
  "scheduleElements": [
    {
      "from": { "name": "Jungfernstieg", "depTime": { "date": "31.01.2026", "time": "14:11" } },
      "to": { "name": "Hamburg Hbf", "arrTime": { "date": "31.01.2026", "time": "14:13" } },
      "line": { "name": "S1", "direction": "Hamburg Airport (Flughafen)", "type": { "simpleType": "TRAIN", "shortInfo": "S", "longInfo": "S-Bahn" } }
    }
  ]
}
```

---

## Other Geofox endpoints (not yet in backend)

The Geofox API (see `mira/Api.json`) also has these; they can be added as backend routes later:

| Geofox endpoint | Use case |
|-----------------|----------|
| `departureList` | Live departures at a station (e.g. “Next S1 in 3 min”). |
| `getStationInformation` | Station details (e.g. elevators, lines). |
| `getAnnouncements` | Disruptions / announcements. |
| `listStations` | All stations (e.g. for autocomplete). |
| `listLines` | All lines. |
| `init` | API version / data release info. |
| `checkName` | Resolve a name to stations (used internally for `/api/routes`). |

---

## Setup

1. **Install dependencies**

   ```bash
   cd mira/backend && npm install
   ```

2. **Credentials**

   Copy `.env.example` to `.env` and set your Geofox GTI credentials (HVV/Geofox API):

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   GEOFOX_USER=your_username
   GEOFOX_PASSWORD=your_password
   ```

   Get credentials from HVV/Geofox (GTI Thin Interface).

3. **Run**

   ```bash
   npm run dev
   ```

   Server runs at `http://localhost:3001` (or `PORT` from `.env`).
