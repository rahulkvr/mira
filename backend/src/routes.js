/**
 * API routes for MIRA backend.
 * POST /api/routes — start + end locations → transit routes (schedules).
 */

import { Router } from 'express';
import { checkName, checkNameResults, getRoute } from './geofox.js';

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

export default router;
