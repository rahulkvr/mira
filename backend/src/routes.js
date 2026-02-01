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
      if (from || to) {
        const now = new Date();
        options.timeRange = {
          begin: from || now.toISOString(),
          end: to || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
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

router.post('/podcast', async (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY
  const elevenKey = process.env.ELEVENLABS_API_KEY
  if (!geminiKey || !elevenKey) {
    return res.status(500).json({ error: 'Podcast generation is not configured.' })
  }

  try {
    const durationMinutes = clampDuration(req.body?.route_duration_minutes)
    const interests = normalizeInterests(req.body?.interests)
    const topicOverride = (req.body?.topic_override || '').trim()
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`

    const numSections = Math.min(3, Math.max(2, Math.ceil(durationMinutes / 4)))
    const wordsPerSection = Math.ceil((durationMinutes * 140) / numSections)

    const prompt = [
      'You are a calm, friendly podcast host. Create a commute podcast script.',
      `Total length: ~${durationMinutes} minutes. Split into exactly ${numSections} sections.`,
      `Each section: ~${wordsPerSection} words. Interests: ${interests.length ? interests.join(', ') : 'general commute, light news, mindful focus'}.`,
      topicOverride ? `Topic: "${topicOverride}".` : 'Suggest a topic that fits the interests.',
      'Return valid JSON only: {"topic":"...","sections":["section1 text","section2 text",...]}',
      'The script should be soothing. No markdown, no extra formatting.',
    ].join('\n')

    const geminiResponse = await axios.post(
      `${geminiEndpoint}?key=${geminiKey}`,
      {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
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
            .map((s) => String(s || '').trim())
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
      sections = splitIntoChunks(singleScript)
    }
    if (sections.length === 0) {
      sections = [
        `Welcome to your commute. Today we'll take a short calming break. Breathe in, breathe out. You've got this.`,
      ]
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'
    const ttsModel = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5'
    const ttsHeaders = {
      'xi-api-key': elevenKey,
      accept: 'audio/mpeg',
      'content-type': 'application/json',
    }

    const ttsResults = []
    for (const text of sections) {
      const r = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: text.slice(0, 5000),
          model_id: ttsModel,
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
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

export default router;
