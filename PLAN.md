# Commute Compose - AI Music for Your Journey

> Generate a unique soundtrack that matches your journey length exactly, with tempo changes based on vehicle speed, mood shifts at transfers, and crescendos as you approach your destination.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [API Integrations](#api-integrations)
5. [Feature Breakdown](#feature-breakdown)
6. [Team Task Distribution](#team-task-distribution)
7. [MVP Scope](#mvp-scope)
8. [Project Structure](#project-structure)
9. [API Keys Required](#api-keys-required)
10. [Sponsor Strategy](#sponsor-strategy)
11. [Viral Hooks & Demo Ideas](#viral-hooks--demo-ideas)

---

## Project Overview

**Commute Compose** transforms boring commutes into personalized musical experiences. Using Hamburg's public transit data (HVV/DB) and MiniMax's AI music generation, the app creates a unique soundtrack that:

- **Matches journey length exactly** - No more songs cutting off or awkward silence
- **Adapts tempo to vehicle speed** - Faster music on express trains, slower during stops
- **Shifts mood at transfers** - Musical transitions when changing lines
- **Builds to a crescendo at arrival** - Satisfying conclusion as you reach your destination
- **Reacts to delays** - Mood shifts to "tense" when delays are detected

### Why This Wins

1. **Strong MiniMax Sponsor Fit** - MiniMax is a hackathon sponsor offering $1,500+ in prizes
2. **Highly Shareable** - "My commute has a personal soundtrack" is viral content
3. **Unique Every Time** - No two journeys sound the same
4. **Solves Real Problem** - Boring commutes affect millions daily

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Route Input    │  │  Journey Map    │  │  Music Player   │              │
│  │  - Start/End    │  │  - Live tracking│  │  - Howler.js    │              │
│  │  - Autocomplete │  │  - Progress viz │  │  - Waveform     │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI/Python)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Route Service  │  │ Music Orchestr. │  │ Realtime Track  │              │
│  │  - Parse routes │  │  - Gen prompts  │  │  - Poll delays  │              │
│  │  - Calc timings │  │  - Map sections │  │  - Update mood  │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
└───────────┼────────────────────┼────────────────────┼────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL APIs                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ HVV Geofox  │  │ DB Transport│  │  MiniMax    │  │ Google Maps │         │
│  │ - Routes    │  │ - Fallback  │  │  Music 2.5  │  │ - Car/Walk  │         │
│  │ - Realtime  │  │ - Germany   │  │  - Generate │  │ - Compare   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User enters** start and end locations
2. **Route Service** fetches journey from HVV Geofox API
3. **Journey parsed** into segments (boarding, traveling, transfer, arrival)
4. **Music Orchestrator** generates MiniMax prompts for each segment
5. **MiniMax API** generates complete soundtrack (30-60s generation time)
6. **Audio streamed** to frontend player
7. **Realtime Tracker** polls for delays, triggers mood updates

---

## Tech Stack

### Frontend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Vite 5** | Build tool | Lightning fast HMR, modern ESM-first |
| **React 18** | UI library | Component-based, hooks, ecosystem |
| **Tailwind CSS** | Styling | Rapid prototyping, beautiful defaults |
| **Howler.js** | Audio playback | Cross-browser, Web Audio API wrapper (planned) |
| **Framer Motion** | Animations | Smooth journey visualizations (planned) |

### Backend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Node.js 20+** | Runtime | Native ESM, fast async I/O |
| **Express 4** | Web framework | Minimal, flexible, large ecosystem |
| **Axios** | HTTP client | Promise-based, interceptors for auth |
| **Supabase JS** | Database client | Type-safe, realtime subscriptions |

### Infrastructure

| Technology | Purpose | Why |
|------------|---------|-----|
| **Vercel** | Frontend hosting | Free tier, instant deploys, preview URLs |
| **Render** | Backend hosting | Free tier (750h/mo), Node.js support, easy setup |
| **Supabase** | Database | PostgreSQL, auth, realtime, storage |
| **GitHub Actions** | CI/CD | Automated testing and deployment pipelines |

---

## API Integrations

### 1. HVV Geofox API (Primary Transit Data)

**Base URL**: `https://gti.geofox.de/gti/public/`

**Authentication**: API Key required (request from HVV developer portal)

#### Key Endpoints

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `checkName` | Search stations/addresses | Autocomplete for route input |
| `getRoute` | Get journey with connections | Core route data |
| `departureCourse` | Complete schedule per station | Precise timing for music sections |
| `getAnnouncements` | Service disruptions | Delay detection for mood shifts |
| `getVehicleMap` | Real-time vehicle positions | Speed-based tempo matching |
| `listLines` | Available transit lines | Show line info in UI |

#### Example: getRoute Response Structure

```json
{
  "realtimeSchedules": [...],
  "schedules": [
    {
      "routeId": "...",
      "route": {
        "segments": [
          {
            "type": "FOOTPATH",
            "start": { "name": "Start Location", "time": "08:00" },
            "end": { "name": "Station A", "time": "08:05" },
            "distance": 350
          },
          {
            "type": "JOURNEY",
            "line": { "name": "U3", "direction": "Barmbek" },
            "start": { "name": "Station A", "time": "08:07" },
            "end": { "name": "Station B", "time": "08:23" },
            "intermediateStops": [...]
          }
        ]
      },
      "totalTime": 35,
      "changes": 1
    }
  ]
}
```

### 2. DB Transport REST API (Fallback/Supplement)

**Base URL**: `https://v5.db.transport.rest/`

**Authentication**: None required (rate limited: 100 req/min)

#### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /locations` | Search stops, addresses, POIs |
| `GET /stops/:id/departures` | Real-time departures |
| `GET /journeys` | Route planning |
| `GET /trips/:id` | Trip details |
| `GET /radar` | Real-time vehicle positions |

#### When to Use

- Inter-city connections (ICE, IC trains)
- Fallback when HVV API is unavailable
- Broader German coverage beyond Hamburg

### 3. MiniMax Music 2.5 API (Core Music Generation)

**Base URL**: `https://api.minimax.io/v1/music_generation`

**Authentication**: API Key (use hackathon credits!)

#### Request Structure

```json
{
  "model": "music-2.5",
  "prompt": "Indie folk, uplifting, morning commute energy, builds gradually",
  "lyrics": "[intro]\n(instrumental, gentle acoustic guitar)\n\n[verse]\nRiding through the city...",
  "audio_setting": {
    "sample_rate": 44100,
    "bitrate": 320000,
    "format": "mp3"
  }
}
```

#### Music Structure Tags

MiniMax supports 14+ structure variants:

| Tag | Description | Journey Mapping |
|-----|-------------|-----------------|
| `[intro]` | Opening section | Boarding / waiting |
| `[verse]` | Main section | Steady travel |
| `[chorus]` | Energetic hook | Express segments |
| `[bridge]` | Transition | Line transfers |
| `[build-up]` | Rising tension | Approaching destination |
| `[drop]` | Peak energy | Arrival moment |
| `[outro]` | Closing | Post-arrival |
| `[interlude]` | Instrumental break | Delays / waiting |

#### Generation Time

- Typical: 30-60 seconds
- Max length: 5 minutes (perfect for commutes!)

### 4. Google Maps API (Car/Walk Comparison)

**Endpoint**: `https://maps.googleapis.com/maps/api/distancematrix/json`

**Purpose**: Show users what they'd miss if driving (the unique soundtrack!)

#### Request Example

```
GET /distancematrix/json?
  origins=Hamburg+Hauptbahnhof
  &destinations=Hamburg+Altona
  &mode=driving
  &key=YOUR_API_KEY
```

**Note**: Google recommends using Compute Route Matrix API for new projects (Distance Matrix is legacy).

---

## Feature Breakdown

### Core Features (MVP)

1. **Route Input**
   - Start/end location with autocomplete
   - Hamburg-focused but extensible
   - Show estimated journey time

2. **Journey Visualization**
   - Map with route overlay
   - Current position indicator
   - Upcoming stops display

3. **Music Generation**
   - Journey-length matched soundtrack
   - Genre/mood selection
   - Loading state during generation

4. **Audio Player**
   - Play/pause controls
   - Progress bar synced to journey
   - Volume control

### Enhanced Features (If Time Permits)

5. **Real-time Adaptation**
   - Delay detection mood shifts
   - Speed-based tempo adjustment
   - Live journey updates

6. **Sharing**
   - Shareable journey links
   - Audio clip export
   - Social media integration

7. **Personalization**
   - Genre preferences
   - Mood presets (energizing, calming, focused)
   - Journey history

---

## Team Task Distribution

### Developer 1: Route & Transit Integration

**Focus**: Backend - HVV/DB API integration

**Tasks**:
- [ ] Set up FastAPI project structure
- [ ] Implement HVV Geofox client
- [ ] Create route parsing logic
- [ ] Extract journey segments with timings
- [ ] Implement station autocomplete endpoint
- [ ] Add DB API as fallback

**Key Files**:
- `backend/services/hvv_service.py`
- `backend/services/db_service.py`
- `backend/models/journey.py`

**API Endpoints to Create**:
- `POST /api/route` - Get route between locations
- `GET /api/stations/search` - Autocomplete stations
- `GET /api/journey/{id}` - Get journey details

---

### Developer 2: Music Generation Pipeline

**Focus**: Backend - MiniMax integration & music orchestration

**Tasks**:
- [ ] Implement MiniMax API client
- [ ] Create journey-to-prompt mapping logic
- [ ] Calculate music section timings
- [ ] Handle async music generation
- [ ] Implement caching for generated tracks
- [ ] Create mood/genre presets

**Key Files**:
- `backend/services/music_service.py`
- `backend/services/prompt_generator.py`
- `backend/models/music.py`

**Journey-to-Music Mapping**:

```python
SEGMENT_TO_SECTION = {
    "waiting": {
        "section": "[intro]",
        "mood": "anticipatory, building",
        "tempo": "slow, 70-80 bpm"
    },
    "boarding": {
        "section": "[verse]", 
        "mood": "excited, movement beginning",
        "tempo": "moderate, 90-100 bpm"
    },
    "traveling": {
        "section": "[chorus]",
        "mood": "steady, rhythmic",
        "tempo": "matches vehicle speed"
    },
    "transfer": {
        "section": "[bridge]",
        "mood": "transitional, shifting",
        "tempo": "variable, building"
    },
    "approaching": {
        "section": "[build-up]",
        "mood": "anticipatory, rising",
        "tempo": "accelerating"
    },
    "arrival": {
        "section": "[outro]",
        "mood": "triumphant, satisfying",
        "tempo": "resolving, slowing"
    }
}
```

---

### Developer 3: Frontend & Audio Player

**Focus**: Frontend - Next.js app & audio experience

**Tasks**:
- [ ] Set up Next.js 14 project with Tailwind
- [ ] Create route input form with autocomplete
- [ ] Build journey map visualization
- [ ] Implement audio player with Howler.js
- [ ] Add loading/generating states
- [ ] Create responsive mobile layout

**Key Files**:
- `frontend/app/page.tsx`
- `frontend/components/RouteInput.tsx`
- `frontend/components/JourneyMap.tsx`
- `frontend/components/MusicPlayer.tsx`

**UI Components**:

```
┌─────────────────────────────────────┐
│  🎵 Commute Compose                 │
├─────────────────────────────────────┤
│  From: [Hamburg Hbf          ▼]     │
│  To:   [Altona               ▼]     │
│                                     │
│  [🎼 Generate My Soundtrack]        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │     Journey Map             │    │
│  │     ●───────●───────●       │    │
│  │    Hbf    Dammtor  Altona   │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  ▶ ━━━━━━━━━━━━━━━━━━━━━━━━━━ 🔊   │
│  0:00              12:34      23:00 │
│                                     │
│  🎵 "Morning Commute Symphony"      │
│  Indie Folk • Uplifting • 23 min    │
└─────────────────────────────────────┘
```

---

### Developer 4: Real-time Features & Polish

**Focus**: Real-time updates, sharing, UX polish

**Tasks**:
- [ ] Implement WebSocket for live updates
- [ ] Add delay detection polling
- [ ] Create shareable journey links
- [ ] Add social sharing buttons
- [ ] Implement dark/light mode
- [ ] Add loading animations
- [ ] Create error handling UI
- [ ] Mobile optimization

**Key Files**:
- `backend/services/realtime_service.py`
- `frontend/components/ShareButton.tsx`
- `frontend/hooks/useJourneyUpdates.ts`

---

## MVP Scope

### Day 1 (Saturday) - Core Functionality

| Time | Goal | Owner |
|------|------|-------|
| Morning | Project setup, API key acquisition | All |
| 10am-12pm | HVV API integration + route parsing | Dev 1 |
| 10am-12pm | MiniMax API integration | Dev 2 |
| 10am-12pm | Next.js setup + route input UI | Dev 3 |
| 10am-12pm | Backend structure + endpoints | Dev 4 |
| 12pm-2pm | Lunch + integration testing | All |
| 2pm-5pm | Connect frontend to backend | Dev 3 + 4 |
| 2pm-5pm | Music generation pipeline | Dev 1 + 2 |
| 5pm-8pm | Basic audio playback working | All |
| Evening | End-to-end flow working | All |

**Day 1 Success Criteria**:
- [ ] Enter route, get journey data
- [ ] Generate music for journey
- [ ] Play audio in browser

### Day 2 (Sunday) - Polish & Demo

| Time | Goal | Owner |
|------|------|-------|
| Morning | Fix bugs from Day 1 | All |
| 10am-12pm | Journey visualization | Dev 3 |
| 10am-12pm | Real-time delay integration | Dev 1 |
| 10am-12pm | Music section timing refinement | Dev 2 |
| 10am-12pm | Sharing functionality | Dev 4 |
| 12pm-2pm | Lunch + polish | All |
| 2pm-4pm | UI polish, animations | Dev 3 + 4 |
| 2pm-4pm | Demo preparation | Dev 1 + 2 |
| 4pm-5pm | Final testing | All |
| 5pm+ | Demo time! | All |

**Day 2 Success Criteria**:
- [ ] Beautiful, polished UI
- [ ] Smooth journey-music experience
- [ ] Compelling demo story

---

## Project Structure

```
mira/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home - route input
│   │   ├── journey/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Journey player page
│   │   └── api/                    # API routes (if needed)
│   ├── components/
│   │   ├── ui/                     # Shadcn/UI components
│   │   ├── RouteInput.tsx          # Start/end location input
│   │   ├── StationAutocomplete.tsx # Station search
│   │   ├── JourneyMap.tsx          # Route visualization
│   │   ├── JourneyProgress.tsx     # Current position
│   │   ├── MusicPlayer.tsx         # Audio controls
│   │   ├── WaveformVisualizer.tsx  # Audio waveform
│   │   ├── ShareButton.tsx         # Social sharing
│   │   └── LoadingStates.tsx       # Generation loading
│   ├── hooks/
│   │   ├── useJourney.ts           # Journey data hook
│   │   ├── useMusic.ts             # Music generation hook
│   │   └── useAudioPlayer.ts       # Howler.js wrapper
│   ├── lib/
│   │   ├── api.ts                  # Backend API client
│   │   └── utils.ts                # Utility functions
│   ├── styles/
│   │   └── globals.css             # Tailwind + custom styles
│   ├── public/
│   │   └── ...                     # Static assets
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── backend/
│   ├── main.py                     # FastAPI app entry
│   ├── config.py                   # Environment config
│   ├── routers/
│   │   ├── routes.py               # Route endpoints
│   │   ├── music.py                # Music endpoints
│   │   └── realtime.py             # WebSocket endpoints
│   ├── services/
│   │   ├── hvv_service.py          # HVV Geofox API client
│   │   ├── db_service.py           # DB Transport API client
│   │   ├── music_service.py        # MiniMax API client
│   │   ├── prompt_generator.py     # Journey-to-prompt logic
│   │   ├── route_service.py        # Route orchestration
│   │   └── realtime_service.py     # Delay detection
│   ├── models/
│   │   ├── journey.py              # Journey data models
│   │   ├── music.py                # Music data models
│   │   └── station.py              # Station models
│   ├── tests/
│   │   └── ...                     # Unit tests
│   └── requirements.txt
│
├── .env.example                    # Environment template
├── .gitignore
├── PLAN.md                         # This file
└── README.md                       # Project overview
```

---

## API Keys Required

| Service | Where to Get | Priority |
|---------|--------------|----------|
| **HVV Geofox** | [gti.geofox.de](https://gti.geofox.de/) - Request developer access | High |
| **MiniMax** | [platform.minimax.io](https://platform.minimax.io/) - Use hackathon credits | High |
| **Google Maps** | [Google Cloud Console](https://console.cloud.google.com/) | Medium |
| **Supabase** | [supabase.com](https://supabase.com/) - Optional for persistence | Low |

### Environment Variables

```env
# Backend
HVV_API_KEY=your_hvv_api_key
HVV_API_SECRET=your_hvv_api_secret
MINIMAX_API_KEY=your_minimax_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key

# Optional
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

---

## Sponsor Strategy

### Primary: MiniMax Track

MiniMax is offering:
- **$1,500+ cash prizes**
- **3 months of MiniMax Max Coding plan**

**How to Win**:
1. **Showcase Music 2.5 prominently** - Make it the star of the demo
2. **Demonstrate unique use case** - Dynamic, journey-aware music is novel
3. **Show real-time adaptation** - Tempo changes, mood shifts
4. **Technical depth** - Show how you map journey data to music prompts

### Demo Script for MiniMax Track

1. "Commutes are boring. What if your journey had a personal soundtrack?"
2. Show route input: "Hamburg Hbf to Altona"
3. "Using MiniMax Music 2.5, we generate a unique 23-minute soundtrack"
4. Show music generation happening
5. "The music is structured to match your journey exactly"
6. Highlight: intro at boarding, bridge at transfer, crescendo at arrival
7. "If there's a delay, the music mood shifts"
8. "Every journey is unique. Your commute, your soundtrack."

---

## Viral Hooks & Demo Ideas

### Shareable Moments

1. **"My commute has its own soundtrack"**
   - Generate shareable audio clips
   - Social media cards with journey + music info

2. **Journey Recaps**
   - "Your morning commute in music form"
   - Weekly recap of all journeys

3. **Comparison Posts**
   - "Boring commute vs. with Commute Compose"
   - Before/after visualization

### Demo Day Ideas

1. **Live Demo**
   - Actually take a journey during demo (if timing works)
   - Show real Hamburg transit + real-time music

2. **Multiple Journeys**
   - Show same route, different times = different music
   - Morning vs. evening mood differences

3. **Delay Reaction**
   - Simulate a delay, show mood shift

4. **User Quotes**
   - "I actually look forward to my commute now"
   - "23 minutes flew by"

---

## Technical Challenges & Solutions

### Challenge 1: Music Generation Time

**Problem**: MiniMax takes 30-60 seconds to generate

**Solution**:
- Start generation immediately when route is selected
- Show engaging loading animation
- Cache generated tracks for return journeys
- Pre-generate for common routes

### Challenge 2: Journey Length Matching

**Problem**: Music must match journey exactly

**Solution**:
- Calculate total journey time from HVV data
- Generate music in sections, combine
- Use MiniMax structure tags for precise timing
- Allow slight fade-out if timing is off

### Challenge 3: Real-time Updates

**Problem**: Journey can change (delays, cancellations)

**Solution**:
- Poll HVV announcements every 30 seconds
- Queue mood-shift audio snippets
- Smooth transitions between moods
- Fallback: "Your journey has changed, regenerating..."

### Challenge 4: HVV API Access

**Problem**: May need to request API access

**Solution**:
- Apply for API access early (Day 1 morning)
- Use DB Transport API as fallback (no auth needed)
- Cache responses during development

---

## Success Metrics

### Hackathon Success

- [ ] Working end-to-end demo
- [ ] Unique, journey-matched soundtrack
- [ ] Compelling 3-minute pitch
- [ ] Strong MiniMax integration showcase

### Product Success (Post-Hackathon)

- Number of journeys generated
- Audio sharing rate
- Return user rate
- Journey completion with music rate

---

## Next Steps

1. **Immediately**: Apply for HVV Geofox API access
2. **Immediately**: Set up MiniMax account with hackathon credits
3. **Day 1 Morning**: Initialize project structure
4. **Day 1 Morning**: Assign tasks to team members
5. **Day 1 End**: Working prototype
6. **Day 2**: Polish and demo prep

---

*Good luck at the Cursor AI-Hackathon Hamburg! 🎵🚇*
