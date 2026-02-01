# DevOps Setup Guide

This document describes how to set up the CI/CD infrastructure for MIRA.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Vite dev server (localhost:5173)                 │
│  Backend:  Express server (localhost:3001)                  │
│  Database: Supabase cloud (free tier)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DEV ENVIRONMENT (develop branch)            │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Vercel Preview (*.vercel.app)                    │
│  Backend:  Render Dev Service                               │
│  Database: Supabase Dev Project                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION (main branch)                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Vercel Production (mira.vercel.app)              │
│  Backend:  Render Production Service                        │
│  Database: Supabase Production Project                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Platform Overview

| Service | Platform | Free Tier | Docs |
|---------|----------|-----------|------|
| Frontend | Vercel | Unlimited hobby projects | [vercel.com/docs](https://vercel.com/docs) |
| Backend | Render | 750 hours/month | [render.com/docs](https://render.com/docs) |
| Database | Supabase | 500MB, 50K requests | [supabase.com/docs](https://supabase.com/docs) |

---

## Local Development Setup

### 1. Install Dependencies

```bash
# Install root dev dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit with your credentials

# Frontend (optional for local)
cp frontend/.env.example frontend/.env.local
# Edit VITE_API_URL if needed
```

### 3. Run Development Servers

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run individually
npm run dev:frontend  # Vite on http://localhost:5173
npm run dev:backend   # Express on http://localhost:3001
```

---

## Vercel Setup (Frontend)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. No credit card required

### Step 2: Import Project
1. Click **Add New** > **Project**
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Configure Environment Variables
In Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Preview Value | Production Value |
|----------|---------------|------------------|
| `VITE_API_URL` | `https://mira-backend-dev.onrender.com` | `https://mira-backend.onrender.com` |

### Step 4: Get IDs for GitHub Actions
1. Install Vercel CLI: `npm i -g vercel`
2. In the frontend folder, run: `vercel link`
3. This creates `.vercel/project.json` with:
   - `orgId` → use as `VERCEL_ORG_ID` secret
   - `projectId` → use as `VERCEL_PROJECT_ID` secret
4. Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens) → use as `VERCEL_TOKEN` secret

---

## Render Setup (Backend)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com) and sign up with GitHub
2. No credit card required for free tier

### Step 2: Create Web Service
1. Click **New** > **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `mira-backend` (or `mira-backend-dev` for dev)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Configure Environment Variables
In Render Dashboard > Service > Environment:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `GEOFOX_USER` | Your HVV API username |
| `GEOFOX_PASSWORD` | Your HVV API password |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `GEMINI_API_KEY` | Your Gemini API key |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Optional voice ID (default Rachel) |

### Step 4: Get Deploy Hook for GitHub Actions
1. Go to Render Dashboard > Service > Settings
2. Scroll to **Deploy Hook**
3. Copy the URL → use as `RENDER_DEPLOY_HOOK_DEV` or `RENDER_DEPLOY_HOOK_PROD` secret

### Step 5: Create Two Services (Dev & Prod)
Repeat steps 2-4 for a second service:
- `mira-backend-dev` → development
- `mira-backend` → production

---

## Supabase Setup (Database)

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com) and sign up
2. No credit card required

### Step 2: Create Project
1. Click **New Project**
2. Choose a name (e.g., `mira-dev` or `mira-prod`)
3. Set a strong database password
4. Select region (Frankfurt for EU)

### Step 3: Get Connection Details
From Project Settings > API:
- **Project URL** → `SUPABASE_URL`
- **anon public key** → `SUPABASE_ANON_KEY`

### Step 4: Create Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Journey history
CREATE TABLE journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  route_data JSONB,
  music_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  preferred_genre TEXT DEFAULT 'indie',
  preferred_mood TEXT DEFAULT 'uplifting',
  interests JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own journeys"
  ON journeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journeys"
  ON journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);
```

---

## GitHub Configuration

### Step 1: Create Environments

Go to **Settings > Environments** and create:

#### `development` environment
- No protection rules needed
- Add secrets (see below)

#### `production` environment
- Enable **Required reviewers** (add team members)
- Restrict to `main` branch only
- Add secrets (see below)

### Step 2: Add Repository Secrets

Go to **Settings > Secrets and variables > Actions**:

| Secret | Description | Source |
|--------|-------------|--------|
| `VERCEL_TOKEN` | Vercel API token | Vercel > Account > Tokens |
| `VERCEL_ORG_ID` | Vercel org ID | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` after `vercel link` |
| `RENDER_DEPLOY_HOOK_DEV` | Render deploy hook URL (dev) | Render > Service > Settings |
| `RENDER_DEPLOY_HOOK_PROD` | Render deploy hook URL (prod) | Render > Service > Settings |

### Step 3: Branch Protection (Recommended)

Go to **Settings > Branches** and add rule for `main`:
- [x] Require pull request before merging
- [x] Require approvals (1+)
- [x] Require status checks to pass
  - Add: `Frontend CI`, `Backend CI`

---

## Deployment Flow

### Development Deployments
```
Feature Branch → PR → CI runs → Merge to develop → Auto-deploy to dev
```

### Production Deployments
```
develop → PR to main → CI runs → Approval required → Merge → Auto-deploy to prod
```

---

## Quick Reference

### Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | All PRs, pushes | Lint, build, test |
| `deploy-dev.yml` | Push to develop | Deploy to dev |
| `deploy-prod.yml` | Push to main | Deploy to prod |

### URLs After Setup

| Service | Dev URL | Prod URL |
|---------|---------|----------|
| Frontend | `*.vercel.app` (preview) | `mira.vercel.app` |
| Backend | `mira-backend-dev.onrender.com` | `mira-backend.onrender.com` |
| Database | Supabase dev project | Supabase prod project |

---

## Troubleshooting

### Vercel Build Failing
- Check `frontend/vercel.json` configuration
- Ensure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets are set

### Render Deploy Not Triggering
- Verify `RENDER_DEPLOY_HOOK_DEV` or `RENDER_DEPLOY_HOOK_PROD` is correct
- Check Render dashboard for deploy logs

### Supabase Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Render env vars
- Check if RLS policies allow the operation

### CORS Errors
- Add your Vercel URL to backend CORS config
- Check `backend/src/index.js` cors settings
