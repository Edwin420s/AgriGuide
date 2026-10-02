# 🚀 AgriGuide Cloud Deployment Guide

This guide details how to deploy **AgriGuide** to production with **Vercel** for the Frontend and **Render** (or **Railway** / **Hugging Face Spaces**) for the Backend.

---

## 🏗️ Architecture Overview

| Tier | Service | Technology | Highlights |
| :--- | :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | React 18, Vite, Tailwind CSS | Global Edge CDN, sub-second TTFB, automatic SSL, SPA routing |
| **Backend** | [Render](https://render.com) / [Railway](https://railway.app) | FastAPI, Python 3.11, Docker | Deterministic MeTTa & Omega cognitive engine, auto-seeded SQLite database |
| **Perception** | [SingularityNET / ASI Cloud](https://singularitynet.io) | OpenAI-compatible endpoint | Structured extraction & multilingual explanations |

---

## Part 1: Deploying the Backend (Render or Railway)

Deploy the backend first so you have the live API URL to link to the frontend.

### Option A: Render.com (Recommended Free/Starter)

1. Sign in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `https://github.com/Edwin420s/AgriGuide`.
4. Configure the service:
   - **Name**: `agriguide-backend`
   - **Language / Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.backend`
   - **Branch**: `main`
   - **Instance Type**: `Free` or `Starter`
5. Under **Environment Variables**, add:
   - `ENVIRONMENT` = `production`
   - `SECRET_KEY` = *(click Generate or enter a random 32+ character string)*
   - `CORS_ORIGINS` = `*`
   - `ASI_CLOUD_URL` = `https://llm.c.singularitynet.io/v1`
   - `ASI_CLOUD_MODEL` = `minimax/minimax-m3`
   - `ASI_CLOUD_KEY` = *(your SingularityNET / ASI Cloud API key if available)*
6. Click **Create Web Service**.
7. Render will build the Docker container and deploy it.
8. Once deployed, copy your backend URL (e.g., `https://agriguide-backend.onrender.com`).
   - Test it in your browser: `https://agriguide-backend.onrender.com/` returns `{"name":"AgriGuide","version":"1.0.0","status":"running"}`.
   - Interactive Swagger API: `https://agriguide-backend.onrender.com/docs`.

---

### Option B: Railway.app

1. Sign in to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Edwin420s/AgriGuide`.
4. Railway will automatically detect `railway.json` and build using `Dockerfile.backend`.
5. Under **Variables**, add:
   - `SECRET_KEY` = `your-secret-key-32-chars-minimum`
   - `CORS_ORIGINS` = `*`
6. Under **Settings** → **Networking**, click **Generate Domain** (e.g., `agriguide-backend.up.railway.app`).

---

## Part 2: Deploying the Frontend (Vercel)

Now that you have your backend URL, deploy the frontend to Vercel.

1. Sign in to [vercel.com](https://vercel.com/).
2. Click **Add New…** → **Project**.
3. Select and import **`Edwin420s/AgriGuide`**.
4. In the project configuration modal:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend` (or leave default since root `vercel.json` is configured).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://YOUR_BACKEND_URL/api` (e.g. `https://agriguide-backend.onrender.com/api`)
6. Click **Deploy**.
7. Vercel will install dependencies, build the production bundle, and assign a production URL (e.g. `https://agriguide.vercel.app`).

---

## Part 3: Deploying via Vercel CLI (Alternative)

If you prefer to deploy from your terminal:

```bash
cd frontend
npx vercel --prod
```

When prompted:
- Set up and deploy: **`Y`**
- Which scope: *(select your Vercel account)*
- Link to existing project: **`N`**
- What's your project's name: **`agriguide`**
- In which directory is your code located: **`./`**
- Want to modify settings: **`N`**

Then add the environment variable in Vercel:
```bash
npx vercel env add VITE_API_URL production
# Enter: https://YOUR_BACKEND_URL/api
npx vercel --prod
```

---

## 🔒 Default Logins for Production

When the backend spins up on a new environment, it automatically initializes and seeds the database:

| Role | Email | Password | Quick Login |
| :--- | :--- | :--- | :--- |
| **Administrator** | `eduedywn5@gmail.com` | `AdminPassword123!` | Click "⚡ Admin Quick Login" |
| **Demo Farmer** | `demo.farmer@agriguide.io` | `DemoPassword123!` | Click "⚡ Demo Farmer Quick Login" |

---

## ✅ Post-Deployment Verification Checklist

1. [ ] **Health Endpoint**: Visit `https://YOUR_BACKEND_URL/` → Should return `{"status":"running"}`.
2. [ ] **Swagger UI**: Visit `https://YOUR_BACKEND_URL/docs` → API endpoints are interactive.
3. [ ] **Frontend Loading**: Visit `https://YOUR_FRONTEND_URL` → Landing page renders with zero console errors.
4. [ ] **Quick Login**: Click "⚡ Demo Farmer Quick Login" → Navigates to Field Intelligence and displays the Kilimo Bora demonstration farm.
5. [ ] **Auditable Decision**: Run "Request Recommendation" → Displays MeTTa rule trace, supersession diff, and SHA-256 Replay Certificate.
