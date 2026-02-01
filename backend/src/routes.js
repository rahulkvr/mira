/**
 * API routes for MIRA backend.
 * POST /api/routes — start + end locations → transit routes (schedules).
 * Addresses are geocoded to coordinates; only coordinates or resolved stations are sent to Geofox.
 */

import { Router } from 'express';
import axios from 'axios';
import { checkName, checkNameResults, getRoute, getAnnouncements } from './geofox.js';

const router = Router();
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

/** Bounding box (left, bottom, right, top) per city to restrict address results. */
const VIEWBOX_BY_CITY = {
  Hamburg: '9.7,53.35,10.2,53.98',
  Berlin: '13.09,52.34,13.76,52.67',
  Munich: '11.36,48.06,11.72,48.25',
  München: '11.36,48.06,11.72,48.25',
};
function getViewbox(city) {
  if (!city || typeof city !== 'string') return null;
  const key = city.trim();
  return VIEWBOX_BY_CITY[key] || VIEWBOX_BY_CITY[key.replace(/\s+/g, '')] || null;
}

/**
 * Geocode an address string to lat/lon via Nominatim. Returns { lat, lon } or null.
 */
async function geocodeAddress(query) {
  const q = (typeof query === 'string' ? query : query?.name ?? '').trim();
  if (!q) return null;
  try {
    const { data } = await axios.get(NOMINATIM_SEARCH, {
      params: { q, format: 'json', limit: 1 },
      headers: { Accept: 'application/json', 'User-Agent': 'MIRA/1.0 (transit app)' },
      timeout: 5000,
    });
    const first = Array.isArray(data) ? data[0] : null;
    if (first?.lat != null && first?.lon != null) {
      return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
    }
  } catch (err) {
    console.warn('Geocode (Nominatim) error:', err.message);
  }
  return null;
}

/**
 * GET /api/stations?q=Jung
 * Station/address autocomplete. Returns { results: RegionalSDName[] }.
 */
/**
 * GET /api/addresses?q=... — Address autocomplete via Nominatim.
 * Optional placeType=gym|university: search for gyms/universities in city (q can be empty or short).
 * Returns { results: [{ display_name, lat, lon }] }.
 */
router.get('/addresses', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const city = (req.query.city || '').trim();
    const placeType = (req.query.placeType || '').trim().toLowerCase();
    const isPlaceTypeSearch = placeType === 'gym' || placeType === 'university';

    if (!isPlaceTypeSearch && (!q || q.length < 3)) {
      return res.json({ results: [] });
    }
    if (isPlaceTypeSearch && !city) {
      return res.json({ results: [] });
    }

    const nominatimQ = isPlaceTypeSearch
      ? q ? `${q} ${city}` : `${placeType} ${city}`
      : q;
    const params = { q: nominatimQ, format: 'json', limit: 5, addressdetails: 0 };
    const viewbox = getViewbox(city);
    if (viewbox) {
      params.viewbox = viewbox;
      params.bounded = isPlaceTypeSearch ? 0 : 1;
    }
    const { data } = await axios.get(NOMINATIM_SEARCH, {
      params,
      headers: { Accept: 'application/json', 'User-Agent': 'MIRA/1.0 (transit app)' },
      timeout: 5000,
    });
    const list = Array.isArray(data) ? data : [];
    const results = list.map((r) => ({ display_name: r.display_name, lat: r.lat, lon: r.lon }));
    return res.json({ results });
  } catch (err) {
    console.warn('GET /api/addresses error:', err.message);
    return res.json({ results: [] });
  }
});

router.get('/stations', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ results: [] });
    }
    const results = await checkNameResults(q);
    return res.json({ results });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Transit API unavailable or invalid credentials.',
      });
    }
    console.error('GET /api/stations error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Resolve a location to SDName for getRoute. Never sends raw address text to Geofox.
 * - If input is already SDName with id/name: return as-is.
 * - Try HVV checkName (station/POI) first.
 * - If not found, geocode address via Nominatim and return COORDINATE (x=lon, y=lat).
 */
async function resolveLocation(input) {
  if (!input) return null;
  if (typeof input === 'object' && input.coordinate && (input.type === 'COORDINATE' || input.type === 'ADDRESS')) return input;
  if (typeof input === 'object' && input.id && input.name) return input;
  const nameOrString = typeof input === 'string' ? input : input?.name ?? '';
  if (!nameOrString) return null;
  const resolved = await checkName(typeof input === 'string' ? input : { name: input.name, city: input.city });
  if (resolved) return resolved;
  const coords = await geocodeAddress(nameOrString);
  if (coords) {
    return { type: 'COORDINATE', coordinate: { x: coords.lon, y: coords.lat, type: 'EPSG_4326' } };
  }
  return null;
}

/**
 * POST /api/routes
 * Body: { start: string | { name, city? }, end: string | { name, city? }, time?: { date, time }, timeIsDeparture?: boolean }
 * Returns: { success, schedules?, error?, returnCode?, errorText? }
 */
router.post('/routes', async (req, res) => {
  try {
    const { start: startInput, end: endInput, time, timeIsDeparture = true, numberOfSchedules } = req.body ?? {};

    if (!startInput || !endInput) {
      return res.status(400).json({
        success: false,
        error: 'Missing start or end. Send { start, end } (names or { name, city }).',
      });
    }

    const [start, end] = await Promise.all([
      resolveLocation(startInput),
      resolveLocation(endInput),
    ]);

    if (!start) {
      return res.status(400).json({
        success: false,
        error: `Could not resolve start location: ${typeof startInput === 'string' ? startInput : startInput?.name ?? '?'}`,
      });
    }
    if (!end) {
      return res.status(400).json({
        success: false,
        error: `Could not resolve end location: ${typeof endInput === 'string' ? endInput : endInput?.name ?? '?'}`,
      });
    }

    const gr = await getRoute(start, end, { time, timeIsDeparture, numberOfSchedules });

    if (gr.returnCode !== 'OK') {
      return res.status(422).json({
        success: false,
        returnCode: gr.returnCode,
        errorText: gr.errorText || gr.errorDevInfo || 'No routes found',
      });
    }

    const schedules = gr.realtimeSchedules ?? gr.schedules ?? [];
    return res.json({
      success: true,
      returnCode: gr.returnCode,
      realtimeAffected: gr.realtimeAffected ?? false,
      schedules,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Transit API unavailable or invalid credentials. Check GEOFOX_USER and GEOFOX_PASSWORD.',
      });
    }
    console.error('POST /api/routes error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/announcements
 * Query: from (ISO date-time, optional), to (ISO date-time, optional)
 * Returns transit announcements (disruptions, messages) for HVV.
 *
 * POST /api/announcements
 * Body: { timeRange?: { begin, end }, names?: string[], filterPlanned?: 'NO_FILTER'|'ONLY_PLANNED'|'ONLY_UNPLANNED', full?: boolean }
 * Same response.
 */
async function handleAnnouncements(req, res) {
  try {
    let options = {};
    if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
      options = {
        timeRange: req.body.timeRange,
        names: req.body.names,
        filterPlanned: req.body.filterPlanned,
        full: req.body.full,
        showBroadcastRelevant: req.body.showBroadcastRelevant,
      };
    } else {
      const from = req.query.from?.trim();
      const to = req.query.to?.trim();
      const stationsParam = req.query.stations ?? req.query.names;
      if (from || to) {
        const now = new Date();
        options.timeRange = {
          begin: from || now.toISOString(),
          end: to || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
      if (stationsParam) {
        const names = typeof stationsParam === 'string'
          ? stationsParam.split(',').map((s) => s.trim()).filter(Boolean)
          : Array.isArray(stationsParam) ? stationsParam.map((s) => String(s).trim()).filter(Boolean) : [];
        if (names.length) options.names = names;
      }
    }
    const data = await getAnnouncements(options);
    if (data.returnCode !== 'OK') {
      return res.status(422).json({
        success: false,
        returnCode: data.returnCode,
        errorText: data.errorText || data.errorDevInfo || 'Announcements request failed',
      });
    }
    return res.json({
      success: true,
      returnCode: data.returnCode,
      announcements: data.announcements ?? [],
      lastUpdate: data.lastUpdate ?? null,
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.response?.status === 401) {
      return res.status(503).json({
        success: false,
        error: 'Transit API unavailable or invalid credentials.',
      });
    }
    if (err.response?.status === 400) {
      const detail = err.response?.data;
      console.error('GET/POST /api/announcements Geofox 400:', detail);
      return res.status(400).json({
        success: false,
        error: 'Transit API rejected request (Bad Request).',
        detail: detail ?? err.message,
      });
    }
    console.error('GET/POST /api/announcements error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
}

router.get('/announcements', handleAnnouncements);
router.post('/announcements', handleAnnouncements);

/** Static fallback when ElevenLabs /v1/voices is unavailable (no key or network). */
const PRESET_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
];

/**
 * GET /api/podcast/voices
 * Returns { voices: [{ id, name }, ...] } for the Voice picker. Uses ElevenLabs API when key is set; else preset list.
 */
router.get('/podcast/voices', async (req, res) => {
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!elevenKey) {
    return res.json({ voices: PRESET_VOICES });
  }
  try {
    const { data } = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': elevenKey, accept: 'application/json' },
      timeout: 10000,
    });
    const list = Array.isArray(data?.voices) ? data.voices : [];
    const voices = list
      .map((v) => ({ id: v.voice_id, name: v.name || v.voice_id }))
      .filter((v) => v.id && v.name)
      .slice(0, 50);
    return res.json({ voices: voices.length ? voices : PRESET_VOICES });
  } catch (err) {
    console.warn('GET /api/podcast/voices error:', err.message);
    return res.json({ voices: PRESET_VOICES });
  }
});

/**
 * POST /api/podcast/suggest-topics
 * Body: { interests?: string[], route_summary?: string, duration_minutes?: number, feeling_lucky?: boolean }
 * Returns: { suggestions: string[] } — 3–5 topic ideas. If feeling_lucky, topics are outside listener interests (surprise me).
 */
router.post('/podcast/suggest-topics', async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: 'Podcast suggestions are not configured.' });
  }
  try {
    const interests = normalizeInterests(req.body?.interests);
    const routeSummary = (req.body?.route_summary || '').trim();
    const durationMinutes = clampDuration(req.body?.duration_minutes);
    const feelingLucky = Boolean(req.body?.feeling_lucky);
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    const prompt = feelingLucky
      ? [
          'I\'m feeling lucky: suggest 3–5 SHORT podcast topic titles that are OUTSIDE the listener\'s usual interests — surprising, weird, or "did you know" style.',
          interests.length ? `Their usual interests (avoid these): ${interests.join(', ')}.` : 'Assume they like typical commute content; suggest something different.',
          'Ideas: bizarre history, underrated inventions, random science, a topic from a completely different field, or something they would never search for. Make each title catchy and intriguing. Return valid JSON only: {"suggestions": ["Topic one", "Topic two", ...]}',
        ].join(' ')
      : [
          'Suggest 3–5 short, engaging podcast topic titles for a commute podcast.',
          `Trip: ~${durationMinutes} minutes. ${routeSummary ? `Route: ${routeSummary}.` : ''}`,
          interests.length ? `Listener interests: ${interests.join(', ')}.` : 'General commute audience.',
          'Make topics varied, timely, and fun — e.g. quick tips, trending angles, or stories that fit the ride. Return valid JSON only: {"suggestions": ["Topic one", "Topic two", ...]}',
        ].join('\n');

    const { data } = await axios.post(
      `${geminiEndpoint}?key=${geminiKey}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: feelingLucky ? 1.0 : 0.8, maxOutputTokens: 512 },
      },
      { timeout: 15000 }
    );

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonCandidate = extractJson(rawText);
    let suggestions = [];
    if (jsonCandidate) {
      try {
        const parsed = JSON.parse(jsonCandidate);
        if (Array.isArray(parsed?.suggestions)) {
          suggestions = parsed.suggestions
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .slice(0, 5);
        }
      } catch {
        // ignore
      }
    }
    return res.json({ suggestions });
  } catch (err) {
    console.warn('POST /api/podcast/suggest-topics error:', err.message);
    return res.status(500).json({ error: 'Could not fetch topic suggestions.', suggestions: [] });
  }
});

const DEFAULT_INTEREST_SUGGESTIONS = [
  'ai-news', 'tech-trends', 'music-releases', 'sports', 'science', 'productivity', 'comedy', 'culture',
];

/**
 * POST /api/podcast/suggest-interests
 * Body: { interests?: string[] }
 * Returns: { suggestions: string[] } — interest tags based on user's interests and what's new in the world.
 */
router.post('/podcast/suggest-interests', async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.warn('POST /api/podcast/suggest-interests: GEMINI_API_KEY not set');
    return res.json({ suggestions: DEFAULT_INTEREST_SUGGESTIONS });
  }
  try {
    const interests = normalizeInterests(req.body?.interests);
    const model = process.env.GEMINI_INTERESTS_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = [
      'You suggest podcast interest tags. The user will see these as clickable suggestions to add to their interests.',
      interests.length
        ? `User's current interests: ${interests.join(', ')}. Suggest 6–8 NEW interest tags that are related to what is happening RIGHT NOW in the world in those areas: current events, recent news, trending topics, new releases, ongoing stories, or "what\'s new" in tech, music, sports, science, etc. Base suggestions on real recent/current happenings that someone with these interests would care about.`
        : 'User has no interests yet. Suggest 6–8 varied, popular interest tags that reflect current trends and what people are talking about now (e.g. tech, AI news, music, sports, science, culture).',
      'Rules: Each tag must be 1–3 words, lowercase, hyphenated for multi-word (e.g. "ai-regulation", "euro-2024", "new-music-releases"). No generic or vague tags. Prefer concrete, timely angles.',
      'Reply with ONLY a JSON object, no other text or markdown. Example: {"suggestions":["tag-one","tag-two","tag-three","tag-four","tag-five","tag-six"]}',
    ].join('\n');

    const { data } = await axios.post(
      `${endpoint}?key=${geminiKey}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 256,
        },
      },
      { timeout: 20000 }
    );

    const candidate = data?.candidates?.[0];
    if (!candidate) {
      console.warn('POST /api/podcast/suggest-interests: no candidates in response', JSON.stringify(data).slice(0, 200));
      return res.json({ suggestions: DEFAULT_INTEREST_SUGGESTIONS });
    }
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
      console.warn('POST /api/podcast/suggest-interests: finishReason', candidate.finishReason);
    }

    let rawText = (candidate?.content?.parts?.[0]?.text || '').trim();
    if (!rawText) {
      return res.json({ suggestions: DEFAULT_INTEREST_SUGGESTIONS });
    }

    const stripMarkdown = (t) => t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    rawText = stripMarkdown(rawText);
    const jsonCandidate = extractJson(rawText) || rawText;
    let suggestions = [];
    try {
      const parsed = typeof jsonCandidate === 'string' ? JSON.parse(jsonCandidate) : jsonCandidate;
      if (Array.isArray(parsed?.suggestions)) {
        suggestions = parsed.suggestions
          .map((s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-'))
          .filter((s) => s.length > 0 && s.length < 50)
          .slice(0, 8);
      }
    } catch {
      const arrayMatch = rawText.match(/"suggestions"\s*:\s*\[([\s\S]*?)\]/);
      if (arrayMatch) {
        try {
          const arr = JSON.parse('[' + arrayMatch[1] + ']');
          suggestions = arr
            .map((s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-'))
            .filter((s) => s.length > 0 && s.length < 50)
            .slice(0, 8);
        } catch {
          // ignore
        }
      }
    }
    if (suggestions.length === 0) {
      return res.json({ suggestions: DEFAULT_INTEREST_SUGGESTIONS });
    }
    return res.json({ suggestions });
  } catch (err) {
    console.warn('POST /api/podcast/suggest-interests error:', err.message, err.response?.data ? err.response.data : '');
    return res.json({ suggestions: DEFAULT_INTEREST_SUGGESTIONS });
  }
});

function clampDuration(value) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return 5
  return Math.min(30, Math.max(2, Math.round(parsed)))
}

function normalizeInterests(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) => String(item || '').replace(/[-_]/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 8)
}

function extractJson(text) {
  if (!text) return null
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

/** Strip title/section/meta from start of a section so TTS gets pure content only. */
function stripSectionIntro(text) {
  if (!text || typeof text !== 'string') return text
  let s = text.trim()
  const patterns = [
    /^Section\s+\d+[.:]\s*/i,
    /^Part\s+(one|\d+)[.:]\s*/i,
    /^Today\s+(we're|we are)\s+(talking about|discussing|covering)[^.]*\.\s*/i,
    /^In this (episode|podcast)[^.]*\.\s*/i,
    /^Welcome to[^.]*\.\s*/i,
    /^This is (your |the )[^.]*\.\s*/i,
    /^Hey (everyone|guys|there)[^.]*\.\s*/i,
    /^So (today|this (episode|time))[^.]*\.\s*/i,
    /^\[.*?\]\s*/,
    /^(The )?topic (today|for this (episode|ride))[^.]*\.\s*/i,
    /^Here('s| is) (what we're |your )[^.]*\.\s*/i,
  ]
  let prev = ''
  while (prev !== s) {
    prev = s
    for (const p of patterns) {
      s = s.replace(p, '').trim()
    }
  }
  return s || text.trim()
}

/** Split script into chunks of ~400-600 chars (~1-2 min each) for parallel TTS. */
function splitIntoChunks(text, targetChunkChars = 500) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return []
  const paras = trimmed.split(/\n\s*\n/)
  const chunks = []
  let current = ''
  for (const p of paras) {
    if (current.length + p.length + 2 <= targetChunkChars) {
      current += (current ? '\n\n' : '') + p
    } else {
      if (current) chunks.push(current.trim())
      if (p.length <= targetChunkChars) {
        current = p
      } else {
        const sentences = p.match(/[^.!?]+[.!?]+/g) || [p]
        current = ''
        for (const s of sentences) {
          if (current.length + s.length <= targetChunkChars) {
            current += s
          } else {
            if (current) chunks.push(current.trim())
            current = s.length <= targetChunkChars ? s : s.slice(0, targetChunkChars)
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

/** Parse Geofox-style time { date: "DD.MM.YYYY", time: "HH:mm" } to minutes since midnight (for relative segment calc). */
function parseTimeToMinutes(t) {
  if (!t || !t.time) return null
  const [h, m] = String(t.time).trim().split(':').map(Number)
  if (Number.isNaN(h)) return null
  return (h || 0) * 60 + (Number.isNaN(m) ? 0 : m)
}

/**
 * Build segment timeline from journey: each segment gets startMin and endMin (trip-relative minutes).
 * Uses dep/arr times if present and parseable; otherwise distributes total_minutes by element count.
 */
function buildSegmentTimeline(journey) {
  const elements = journey?.schedule_elements
  const totalMin = Math.max(1, Number(journey?.total_minutes) || 0)
  if (!Array.isArray(elements) || elements.length === 0) {
    return []
  }
  const withMinutes = elements.map((el) => {
    const dep = parseTimeToMinutes(el.dep_time)
    const arr = parseTimeToMinutes(el.arr_time)
    const duration = dep != null && arr != null ? Math.max(0, arr - dep) : null
    return { ...el, _durationMin: duration }
  })
  const hasTimes = withMinutes.every((el) => el._durationMin != null)
  if (hasTimes) {
    const firstDep = parseTimeToMinutes(elements[0]?.dep_time)
    if (firstDep == null) return distributeEvenly(elements, totalMin)
    let cur = 0
    return withMinutes.map((el) => {
      const startMin = Math.round(cur)
      const dur = el._durationMin ?? 0
      cur += dur
      return { ...el, startMin, endMin: Math.round(cur) }
    })
  }
  return distributeEvenly(elements, totalMin)
}

function distributeEvenly(elements, totalMin) {
  const n = elements.length
  const each = totalMin / n
  return elements.map((el, i) => ({
    ...el,
    startMin: Math.round(i * each),
    endMin: Math.round((i + 1) * each),
  }))
}

/** Local time context string (morning/afternoon/evening) from ISO or date. */
function getTimeOfDayContext(localTimeStr) {
  if (!localTimeStr) return ''
  let date
  if (typeof localTimeStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(localTimeStr)) {
    date = new Date(localTimeStr)
  } else {
    date = new Date()
  }
  const h = date.getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

/** Mood → Gemini tone + ElevenLabs voice_settings. Lower stability = more expressive, less monotonous. */
const MOOD_CONFIG = {
  slow: { tone: 'relaxed, reflective, warm. Calm pacing. Opening: warm and inviting, not loud.', stability: 0.42, similarity_boost: 0.76 },
  energetic: { tone: 'upbeat, engaging. Steady energy. Opening: punchy hook.', stability: 0.22, similarity_boost: 0.72 },
  fast: { tone: 'punchy, quick cuts, snappy. Higher pace. Opening: bold, attention-grabbing.', stability: 0.18, similarity_boost: 0.70 },
  hyper: { tone: 'high energy, excited, radio-jockey style. Maximum energy. Opening: explosive hook.', stability: 0.14, similarity_boost: 0.68 },
}

/**
 * POST /api/podcast
 * Body: { journey?, interests?, topic_override?, mood?, voice_id?, feeling_lucky?, regenerate? }
 * - mood: 'slow'|'energetic'|'fast'|'hyper' — used in Gemini prompt and ElevenLabs stability.
 * - voice_id: optional ElevenLabs voice ID per request; if omitted, uses ELEVENLABS_VOICE_ID from env.
 * - feeling_lucky: surprising topic outside listener interests.
 * - regenerate: different angle/tone/structure.
 */
router.post('/podcast', async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY
  const elevenKey = process.env.ELEVENLABS_API_KEY
  if (!geminiKey || !elevenKey) {
    return res.status(500).json({ error: 'Podcast generation is not configured.' })
  }

  try {
    const journey = req.body?.journey
    const durationMinutes = clampDuration(
      journey?.total_minutes ?? req.body?.route_duration_minutes
    )
    const interests = normalizeInterests(req.body?.interests)
    const topicOverride = (req.body?.topic_override || '').trim()
    const moodRaw = (req.body?.mood || 'energetic').toLowerCase()
    const mood = MOOD_CONFIG[moodRaw] ? moodRaw : 'energetic'
    const moodConfig = MOOD_CONFIG[mood]
    const feelingLucky = Boolean(req.body?.feeling_lucky)
    const regenerate = Boolean(req.body?.regenerate)
    const voiceIdOverride = (req.body?.voice_id ?? req.body?.voiceId ?? '').trim()
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`

    const numSections = Math.min(6, Math.max(2, Math.ceil(durationMinutes / 3)))
    const wordsPerSection = Math.ceil((durationMinutes * 140) / numSections)

    const segments = journey ? buildSegmentTimeline(journey) : []
    const startName = journey?.start_name || 'start'
    const destName = journey?.dest_name || 'destination'
    const timeOfDay = getTimeOfDayContext(journey?.local_time)

    const segmentLines = segments.map(
      (s) =>
        `- From ${s.from_name || '?'} to ${s.to_name || '?'}, line ${s.line_name || '?'} (${s.line_type_short || 'transit'}), trip minutes ${s.startMin ?? 0}–${s.endMin ?? 0}`
    )
    const journeyBlock =
      segmentLines.length > 0
        ? [
            `The listener's journey: ${startName} → ${destName}.`,
            'Segment timeline (weave these into the script at the right moments):',
            ...segmentLines,
            timeOfDay ? `Current time of day: ${timeOfDay}.` : '',
          ]
            .filter(Boolean)
            .join('\n')
        : ''

    // Creative, dynamic prompt: PURE CONTENT ONLY — no title, no section labels, no meta
    const hostPersona = [
      'You write ONLY the spoken words. No title, no section labels, no meta.',
      'FORBIDDEN: Do NOT start with or include: the topic title, "Section 1", "Part 1", "In this episode", "Today we\'re discussing", "Welcome to", "This is your…", or any intro that names the show or episode. Real podcasts often jump straight into content — so must this. The very first word of the first section must be the hook: a question, a bold claim, or a fact — not a greeting or title.',
      `TONE AND PACING (strict): ${moodConfig.tone}`,
      'Vary delivery: mix short punchy sentences with longer ones. Use hooks, callbacks, surprises. Sound like a sharp, curious host — not a script reader.',
    ].join(' ')
    let topicInterestsBlock = ''
    if (feelingLucky) {
      topicInterestsBlock = [
        'FEELING LUCKY MODE: Ignore the listener\'s usual interests. Pick something SURPRISING and NEW: a topic they would never search for — e.g. a weird history fact, an underrated invention, a bizarre science story, or a "did you know" from a completely different field. Make it fascinating and shareable.',
        topicOverride ? `Suggested angle: "${topicOverride}". Run with it in an unexpected way.` : 'Choose one surprising topic that would make someone say "I never thought I\'d care about that."',
      ].join(' ')
    } else if (regenerate) {
      topicInterestsBlock = [
        'REGENERATE MODE: The user just asked for a DIFFERENT podcast. Give a completely different angle, tone, or framing. Use different examples, a different hook, and a different structure. Do NOT repeat the same opening or content.',
        `Interests (use them but from a fresh angle): ${interests.length ? interests.join(', ') : 'general commute, light news'}.`,
        topicOverride ? `Topic: "${topicOverride}". Approach it in a new way.` : 'Pick a topic that fits the interests but present it in an entirely new way.',
      ].join(' ')
    } else {
      topicInterestsBlock = [
        'INTERESTS (mandatory — the script MUST draw directly from these):',
        interests.length
          ? `${interests.map((i) => `- ${i.replace(/[-_]/g, ' ')}`).join('\n')}. Weave in specific content for EACH: e.g. tech/coding → tips, tools, or news; music/lofi → vibes, artists, or culture; sports → stories, stats, or drama. Do not give a generic script — reference the actual interest labels and make the listener feel it was built for them.`
          : 'General commute, light news, curious about the world. Keep it engaging and specific.',
        topicOverride ? `Topic/angle: "${topicOverride}". Tie it to the interests above where natural.` : 'Suggest a topic that fits the interests and that you can make genuinely engaging — not generic.',
      ].join(' ')
    }
    const prompt = [
      hostPersona,
      `Write ONLY what the host says. Total length: ~${durationMinutes} minutes. Split into exactly ${numSections} sections. Each section: ~${wordsPerSection} words.`,
      topicInterestsBlock,
      journeyBlock
        ? `${journeyBlock}\nWeave in the journey naturally (e.g. "as you leave X on the S1…", "when you reach Y…").`
        : '',
      'CRITICAL: "topic" is for the app UI only — the host must NEVER say it. Each section is ONLY spoken content: no "Section 1", no "Part one", no title, no "Today we\'re talking about…". First section = hook only (question, claim, or fact).',
      'Return valid JSON only: {"topic":"...","sections":["section1 text","section2 text",...]}. No markdown.',
    ]
      .filter(Boolean)
      .join('\n')

    const creativityTemp = feelingLucky || regenerate ? 1.0 : 0.9
    const geminiResponse = await axios.post(
      `${geminiEndpoint}?key=${geminiKey}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: creativityTemp,
          maxOutputTokens: Math.min(4096, Math.max(1024, durationMinutes * 200)),
        },
      },
      { timeout: 60000 }
    )

    const rawText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (geminiResponse.data?.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Content blocked by safety filters. Try a different topic.')
    }
    const jsonCandidate = extractJson(rawText)
    let topic = topicOverride || 'Commute companion'
    let sections = []
    if (jsonCandidate) {
      try {
        const parsed = JSON.parse(jsonCandidate)
        if (parsed?.topic) topic = parsed.topic
        if (Array.isArray(parsed?.sections) && parsed.sections.length > 0) {
          sections = parsed.sections
            .map((s) => stripSectionIntro(String(s || '').trim()))
            .filter(Boolean)
            .slice(0, 6)
        }
      } catch {
        // fallback
      }
    }
    if (sections.length === 0) {
      let singleScript = rawText
      if (jsonCandidate) {
        try {
          const p = JSON.parse(jsonCandidate)
          singleScript = p.script || rawText
        } catch {
          singleScript = rawText
        }
      }
      sections = splitIntoChunks(singleScript).map(stripSectionIntro)
    }
    if (sections.length === 0) {
      sections = [
        `Alright — let's go. You're on the move and we're making this count. Here we go!`,
      ]
    }

    // Voice ID: per-request (voice_id in body) or fallback to env. Dynamic = client can send a different voice each time.
    const voiceId = voiceIdOverride || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
    const ttsModel = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5'
    const ttsHeaders = {
      'xi-api-key': elevenKey,
      accept: 'audio/mpeg',
      'content-type': 'application/json',
    }
    // Mood → ElevenLabs: stability (lower = more expressive), similarity_boost
    const voiceSettings = {
      stability: moodConfig.stability,
      similarity_boost: moodConfig.similarity_boost,
    }

    const ttsResults = []
    for (const text of sections) {
      const r = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text.slice(0, 5000),
          model_id: ttsModel,
          voice_settings: voiceSettings,
          optimize_streaming_latency: 4,
        },
        {
          headers: ttsHeaders,
          responseType: 'arraybuffer',
          timeout: 45000,
        }
      )
      ttsResults.push(r)
    }
    const buffers = ttsResults.map((r) => Buffer.from(r.data))
    const fullScript = sections.join('\n\n')

    const merged = Buffer.concat(buffers)
    const audioBase64 = merged.toString('base64')

    return res.json({
      topic,
      script: fullScript,
      audio_base64: audioBase64,
      duration_minutes: durationMinutes,
    })
  } catch (err) {
    const data = err.response?.data
    let parsed = data
    if (typeof data === 'object' && data?.constructor?.name === 'Buffer') {
      try { parsed = JSON.parse(data.toString('utf8')) } catch { parsed = data.toString('utf8') }
    }
    const detail = parsed || data || err.message
    console.error('POST /api/podcast error:', detail)
    let msg = 'Failed to generate podcast audio.'
    if (typeof parsed === 'object') {
      msg = parsed.detail?.message || parsed.error?.message || parsed.message || parsed.detail?.status || parsed.error || JSON.stringify(parsed).slice(0, 200)
    } else if (typeof data === 'object' && data?.constructor?.name !== 'Buffer') {
      msg = data.detail?.message || data.error?.message || data.message || data.error || JSON.stringify(data).slice(0, 200)
    } else if (typeof detail === 'string') {
      msg = detail
    }
    return res.status(500).json({ error: String(msg).slice(0, 300) || 'Failed to generate podcast audio.' })
  }
})

/** Gemini image aspect ratios: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9" */
const GEMINI_ASPECT_RATIOS = [
  { ratio: 1 / 1, value: '1:1' },
  { ratio: 2 / 3, value: '2:3' },
  { ratio: 3 / 2, value: '3:2' },
  { ratio: 3 / 4, value: '3:4' },
  { ratio: 4 / 3, value: '4:3' },
  { ratio: 9 / 16, value: '9:16' },
  { ratio: 16 / 9, value: '16:9' },
  { ratio: 21 / 9, value: '21:9' },
];
function aspectRatioForScreen(width, height) {
  if (!width || !height || width <= 0 || height <= 0) return '9:16';
  const r = width / height;
  let best = GEMINI_ASPECT_RATIOS[0];
  let bestDiff = Math.abs(r - best.ratio);
  for (const entry of GEMINI_ASPECT_RATIOS) {
    const diff = Math.abs(r - entry.ratio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = entry;
    }
  }
  return best.value;
}

/**
 * POST /api/micromaster/generate
 * Body: { topic: string, width?: number, height?: number }
 * Returns: { topic, slides: [{ title, script, image_base64, audio_base64 }] }
 * Uses Gemini 2.5 Flash (text) for lesson structure, gemini-2.5-flash-image for visuals (aspect from screen size), ElevenLabs for audio.
 */
router.post('/micromaster/generate', async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const geminiImageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  if (!geminiKey || !elevenKey) {
    return res.status(500).json({ error: 'MicroMaster is not configured. GEMINI_API_KEY and ELEVENLABS_API_KEY required.' });
  }

  const topic = (req.body?.topic || '').trim();
  if (!topic) {
    return res.status(400).json({ error: 'Topic is required. Send { topic: "e.g. JavaScript closures" }.' });
  }

  const screenWidth = Math.max(0, parseInt(req.body?.width, 10) || 0);
  const screenHeight = Math.max(0, parseInt(req.body?.height, 10) || 0);
  const imageAspectRatio = aspectRatioForScreen(screenWidth, screenHeight);

  try {
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

    const structurePrompt = [
      `Create exactly 5 bite-sized lesson slides for the topic: "${topic}".`,
      'Each slide: title (short, 3-8 words), script (1-2 sentences for text-to-speech, ~20-30 sec), image_prompt (one clear sentence describing a visual for AI image generation, educational style, no text in image).',
      'Keep scripts and image_prompts concise so all 5 slides fit in one response.',
    ].join('\n');

    const slidesSchema = {
      type: 'object',
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Short slide title, 3-8 words' },
              script: { type: 'string', description: '1-2 sentences for TTS, ~20-30 sec' },
              image_prompt: { type: 'string', description: 'One-sentence visual description for AI image' },
            },
            required: ['title', 'script', 'image_prompt'],
          },
          minItems: 5,
          maxItems: 5,
        },
      },
      required: ['slides'],
    };

    let geminiResponse;
    try {
      geminiResponse = await axios.post(
        `${geminiEndpoint}?key=${geminiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: structurePrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16384,
            responseMimeType: 'application/json',
            responseJsonSchema: slidesSchema,
          },
        },
        { timeout: 60000 }
      );
    } catch (geminiErr) {
      throw geminiErr;
    }

    const rawText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const finishReason = geminiResponse.data?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('Content blocked by safety filters. Try a different topic.');
    }
    const jsonCandidate = extractJson(rawText);
    let slides = [];
    if (jsonCandidate) {
      try {
        const parsed = JSON.parse(jsonCandidate);
        const rawSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];
        const slidesBeforeFilter = rawSlides.slice(0, 5).map((s) => ({
          title: String(s?.title || '').trim() || 'Slide',
          script: String(s?.script || '').trim() || '',
          image_prompt: String(s?.image_prompt || '').trim() || '',
        }));
        slides = slidesBeforeFilter.filter((s) => s.script && s.image_prompt);
      } catch {
        // fallback
      }
    }
    if (slides.length === 0) {
      throw new Error('Could not generate lesson structure. Please try a different topic.');
    }

    const geminiImageEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiImageModel}:generateContent`;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    const ttsModel = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';
    const ttsHeaders = {
      'xi-api-key': elevenKey,
      accept: 'audio/mpeg',
      'content-type': 'application/json',
    };
    const voiceSettings = { stability: 0.35, similarity_boost: 0.8 };

    const enrichedSlides = await Promise.all(
      slides.map(async (slide, i) => {
        let imageBase64 = '';
        let audioBase64 = '';

        const [imgResult, ttsResult] = await Promise.allSettled([
          axios.post(
            `${geminiImageEndpoint}?key=${geminiKey}`,
            {
              contents: [{ role: 'user', parts: [{ text: slide.image_prompt }] }],
              generationConfig: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: imageAspectRatio },
              },
            },
            { timeout: 60000 }
          ),
          slide.script
            ? axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                  text: slide.script.slice(0, 5000),
                  model_id: ttsModel,
                  voice_settings: voiceSettings,
                  optimize_streaming_latency: 4,
                },
                { headers: ttsHeaders, responseType: 'arraybuffer', timeout: 45000 }
              )
            : Promise.resolve(null),
        ]);

        if (imgResult.status === 'fulfilled') {
          const parts = imgResult.value?.data?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              imageBase64 = part.inlineData.data;
              break;
            }
          }
        } else {
          console.warn(`MicroMaster image ${i + 1} failed:`, imgResult.reason?.message);
        }

        if (ttsResult.status === 'fulfilled' && ttsResult.value?.data) {
          audioBase64 = Buffer.from(ttsResult.value.data).toString('base64');
        } else if (slide.script && ttsResult.status === 'rejected') {
          console.warn(`MicroMaster TTS ${i + 1} failed:`, ttsResult.reason?.message);
        }

        return {
          title: slide.title,
          script: slide.script,
          image_base64: imageBase64 || null,
          audio_base64: audioBase64 || null,
        };
      })
    );

    return res.json({
      topic,
      slides: enrichedSlides,
    });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message || 'Failed to generate MicroMaster lesson.';
    console.error('POST /api/micromaster/generate error:', msg);
    return res.status(500).json({ error: String(msg).slice(0, 300) });
  }
});

export default router;
