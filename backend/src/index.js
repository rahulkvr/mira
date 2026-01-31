/**
 * MIRA backend — transit routes via Geofox GTI (HVV).
 * Requires .env: GEOFOX_USER, GEOFOX_PASSWORD
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, service: 'mira-backend' }));
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`MIRA backend running at http://localhost:${PORT}`);
  if (!process.env.GEOFOX_USER || !process.env.GEOFOX_PASSWORD) {
    console.warn('Warning: GEOFOX_USER or GEOFOX_PASSWORD not set. Route requests will fail.');
  }
});
