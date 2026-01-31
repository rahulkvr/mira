# MIRA Frontend

React + Vite + Tailwind UI for the MIRA backend. Enter start and end stations to see the first 5 route options.

## Run

1. **Start the backend** (from `mira/backend`):

   ```bash
   npm run dev
   ```

2. **Start the frontend** (from `mira/frontend`):

   ```bash
   npm install
   npm run dev
   ```

3. Open **http://localhost:5173**. The app proxies `/api` to the backend on port 3001.

## Build

```bash
npm run build
```

Static output is in `dist/`. For production, set `VITE_API_URL` to your backend base URL if it’s not same-origin.
