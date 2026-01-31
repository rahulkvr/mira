/**
 * Geofox GTI API client (HVV transit).
 * Auth: Geofox HMAC (geofox-auth-user, geofox-auth-type, geofox-auth-signature).
 * See e.g. github.com/JonasDoebertin/php-geofox-gti-client
 */

import axios from 'axios';
import crypto from 'crypto';

const GTI_BASE = process.env.GEOFOX_BASE_URL || 'http://gti.geofox.de';

/**
 * Create axios instance with Geofox HMAC auth (not HTTP Basic).
 * Signature = base64(hmac-sha1(requestBody, password)).
 */
function createClient() {
  const user = process.env.GEOFOX_USER;
  const password = process.env.GEOFOX_PASSWORD;
  if (!user || !password) {
    throw new Error('GEOFOX_USER and GEOFOX_PASSWORD must be set in .env');
  }
  const client = axios.create({
    baseURL: GTI_BASE,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'geofox-auth-user': user,
      'geofox-auth-type': 'HmacSHA1',
    },
  });
  client.interceptors.request.use((config) => {
    const body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data || {});
    const signature = crypto.createHmac('sha1', password).update(body).digest('base64');
    config.headers['geofox-auth-signature'] = signature;
    config.headers['X-Platform'] = config.headers['X-Platform'] || 'web';
    config.headers['X-TraceId'] = config.headers['X-TraceId'] || crypto.randomUUID();
    return config;
  });
  return client;
}

/**
 * Resolve a location name to SDName(s). Uses checkName.
 * @param {string|{name: string, city?: string}} input - Station/address name or SDName-like object
 * @returns {Promise<object|null>} First matching result (RegionalSDName) or null
 */
/** Max results for autocomplete dropdown */
const CHECK_NAME_MAX_LIST = 10;

export async function checkName(input) {
  const theName =
    typeof input === 'string'
      ? { name: input }
      : { name: input.name, city: input.city, combinedName: input.combinedName };
  const client = createClient();
  const { data } = await client.post('/gti/public/checkName', {
    language: 'de',
    version: 1,
    filterType: 'HVV_LISTED',
    theName,
    maxList: 5,
  });
  if (data.returnCode !== 'OK' || !data.results?.length) {
    return null;
  }
  return data.results[0];
}

/**
 * Station/address search for autocomplete. Returns all matches (not just first).
 * @param {string} query - Search text
 * @param {number} maxList - Max results (default 10)
 * @returns {Promise<object[]>} results (RegionalSDName[])
 */
export async function checkNameResults(query, maxList = CHECK_NAME_MAX_LIST) {
  const q = (query || '').trim();
  if (!q) return [];
  const client = createClient();
  const { data } = await client.post('/gti/public/checkName', {
    language: 'de',
    version: 1,
    filterType: 'HVV_LISTED',
    theName: { name: q },
    maxList: Math.min(Math.max(1, maxList), 20),
  });
  if (data.returnCode !== 'OK' || !data.results?.length) return [];
  return data.results;
}

/**
 * Get route options between start and destination.
 * @param {object} start - SDName (e.g. from checkName or { name, id, coordinate })
 * @param {object} dest - SDName
 * @param {object} options - { time?: { date, time }, timeIsDeparture?: boolean, numberOfSchedules?: number }
 * @returns {Promise<object>} GRResponse: { returnCode, schedules, errorText?, ... }
 */
export async function getRoute(start, dest, options = {}) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const { time: reqTime = { date, time }, timeIsDeparture = true, numberOfSchedules: rawNum = 10 } = options;
  const num = Math.min(Math.max(1, Number(rawNum) || 10), 20);
  const numberOfSchedules = num;
  // Only next departures from search time (no past journeys)
  const schedulesBefore = 0;
  const schedulesAfter = Math.max(0, num - 1);

  const client = createClient();
  const { data } = await client.post('/gti/public/getRoute', {
    language: 'de',
    version: 1,
    filterType: 'HVV_LISTED',
    start: normalizeSDName(start),
    dest: normalizeSDName(dest),
    time: reqTime,
    timeIsDeparture,
    numberOfSchedules,
    schedulesBefore,
    schedulesAfter,
    realtime: 'AUTO',
  });
  return data;
}

function normalizeSDName(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  if (obj.name != null) out.name = obj.name;
  if (obj.city != null) out.city = obj.city;
  if (obj.combinedName != null) out.combinedName = obj.combinedName;
  if (obj.id != null) out.id = obj.id;
  if (obj.globalId != null) out.globalId = obj.globalId;
  if (obj.type != null) out.type = obj.type;
  if (obj.coordinate != null) out.coordinate = { ...obj.coordinate, type: obj.coordinate.type || 'EPSG_4326' };
  return out;
}

/**
 * Get transit announcements (disruptions, messages).
 * Geofox expects minimal request; timeRange optional and format must match API.
 * @param {object} options - { timeRange?: { begin, end } (ISO date-time), names?: string[], filterPlanned?: 'NO_FILTER'|'ONLY_PLANNED'|'ONLY_UNPLANNED', full?: boolean }
 * @returns {Promise<object>} AnnouncementResponse: { returnCode, announcements, lastUpdate, errorText? }
 */
export async function getAnnouncements(options = {}) {
  const body = {
    language: 'de',
    version: 1,
    filterType: options.filterType ?? 'NO_FILTER',
    full: options.full ?? false,
    filterPlanned: options.filterPlanned ?? 'NO_FILTER',
    showBroadcastRelevant: options.showBroadcastRelevant ?? false,
  };
  if (options.names?.length) body.names = options.names;

  // Only send timeRange if provided; Geofox may 400 on invalid or unexpected format
  if (options.timeRange?.begin != null && options.timeRange?.end != null) {
    body.timeRange = {
      begin: options.timeRange.begin,
      end: options.timeRange.end,
    };
  }

  const client = createClient();
  const { data } = await client.post('/gti/public/getAnnouncements', body);
  return data;
}
