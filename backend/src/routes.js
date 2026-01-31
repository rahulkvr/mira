/**
 * API routes for MIRA backend.
 * POST /api/routes — start + end locations → transit routes (schedules).
 */

import { Router } from 'express';
import { checkName, checkNameResults, getRoute, getAnnouncements } from './geofox.js';

const router = Router();

/**
 * GET /api/stations?q=Jung
 * Station/address autocomplete. Returns { results: RegionalSDName[] }.
 */
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
 * Resolve a location to SDName. Accepts string or { name, city? }.
 */
async function resolveLocation(input) {
  if (!input) return null;
  if (typeof input === 'object' && input.id && input.name) return input;
  const resolved = await checkName(input);
  return resolved ?? null;
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

export default router;
