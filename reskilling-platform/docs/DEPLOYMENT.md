# Deployment Guide

This guide covers deploying the full platform to production:
- **Frontend** → GitHub Pages (free, CDN-distributed)
- **Backend** → Railway (free tier, Docker-native)

---

## Prerequisites

- GitHub account (repo owner: [JHUB-AFRICA](https://github.com/JHUB-AFRICA))
- Railway account ([railway.app](https://railway.app)) — free tier requires GitHub login
- Supabase project (already configured)
- Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))

---

## Step 1 — Deploy the Backend to Railway

### 1a. Connect your GitHub repo to Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**
3. Authorise Railway to access your GitHub account
4. Select `JHUB-AFRICA/ai-reskilling-think-tank`
5. When asked which directory: select `reskilling-platform/`

Railway detects the `Dockerfile` automatically.

### 1b. Set Environment Variables on Railway

In the Railway project dashboard → **Variables**, add:

| Variable | Value | Notes |
|---|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` | From Supabase → Settings → Data API |
| `SUPABASE_ANON_KEY` | `eyJ...` | From Supabase → Settings → Data API |
| `SUPABASE_JWT_SECRET` | `<jwt-secret>` | From Supabase → Settings → Data API → JWT Secret |
| `DATABASE_URL` | `postgresql://...` | From Supabase → Settings → Database → Connection string |
| `GEMINI_API_KEY` | `AIza...` | From Google AI Studio |
| `CORS_ORIGINS` | `https://JHUB-AFRICA.github.io` | Your GitHub Pages URL |
| `PORT` | `8000` | Railway auto-detects, but set explicitly for Dockerfile |

### 1c. Note your Railway URL

After deploy, Railway gives you a URL like:
```
https://ai-reskilling-api.up.railway.app
```

Copy this — you need it for the next step.

### 1d. Verify the backend is live

```bash
curl https://ai-reskilling-api.up.railway.app/health
# Expected: {"status":"ok"}

# Open API docs in browser:
# https://ai-reskilling-api.up.railway.app/docs
```

---

## Step 2 — Configure GitHub Actions Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these secrets:

| Secret Name | Value | Used By |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | Frontend deploy workflow |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Frontend deploy workflow |
| `VITE_API_URL` | `https://ai-reskilling-api.up.railway.app` | Frontend deploy workflow |

> ⚠️ These are **repository secrets**, not environment vars in your code. They are never exposed in logs or source.

---

## Step 3 — Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

The first time you push to `main`, the `Deploy Frontend to GitHub Pages` workflow will run and deploy the frontend.

Your live URL will be:
```
https://JHUB-AFRICA.github.io/ai-reskilling-think-tank/
```

---

## Step 4 — Configure Branch Protection

1. Go to your repo → **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Set **Branch name pattern**: `main`
4. Enable:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals**: 1
   - ✅ **Require status checks to pass before merging**
     - Add: `Backend CI / Tests (pytest — 86 tests)`
     - Add: `Frontend CI / Build Verification`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings**
5. Click **Create**

---

## Step 5 — Verify the Full Deployment

1. Open `https://JHUB-AFRICA.github.io/ai-reskilling-think-tank/`
2. Register a new account
3. Log in → should redirect to Dashboard
4. Go to **Career Analysis** → paste a resume → select an occupation → submit
5. Check the API docs at `https://ai-reskilling-api.up.railway.app/docs`

---

## Troubleshooting

### Frontend shows "API Offline"
→ The backend at `VITE_API_URL` is not reachable.  
→ Check: Railway dashboard → your service → is it running?  
→ Check: `CORS_ORIGINS` on Railway includes your GitHub Pages URL.

### GitHub Actions deploy fails with "Missing secret"
→ Re-check: Settings → Secrets → all 3 secrets are added (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`).

### 401 Unauthorized on protected API routes
→ `SUPABASE_JWT_SECRET` on Railway does not match your Supabase project.  
→ Get the correct secret from: Supabase Dashboard → Project Settings → Data API → JWT Secret.

### Railway container exits immediately
→ The spaCy model download inside the Docker build may have timed out.  
→ Check Railway build logs. If the model download fails, rebuild.

---

## Sharing with Testers

Once deployed, share these links:

| Link | Purpose |
|---|---|
| `https://JHUB-AFRICA.github.io/ai-reskilling-think-tank/` | Live application |
| `https://ai-reskilling-api.up.railway.app/docs` | API documentation |
| `https://github.com/JHUB-AFRICA/ai-reskilling-think-tank` | Source code |

To gather structured feedback, consider creating a GitHub Discussion or a simple Google Form linked from the app.
