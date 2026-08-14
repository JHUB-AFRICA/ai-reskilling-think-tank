# Running the Platform — Complete Startup Guide

Both projects share the same Supabase project for auth and the same PostgreSQL database.
The **Reskilling Platform** (FastAPI backend) serves the API.  
The **CareerDev** (Vite + React frontend) serves the UI.

---

## Prerequisites

### Backend (one-time setup)
```bash
cd reskilling-platform

# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # Mac / Linux

# 2. Install the package in editable mode with dev extras
pip install -e ".[dev]"

# 3. Download the spaCy NLP model (for /extract-skills endpoint)
python -m spacy download en_core_web_md

# 4. Copy the environment file and fill in your credentials
copy .env.example .env        # Windows
# cp .env.example .env        # Mac / Linux
# Then open .env and set: SUPABASE_JWT_SECRET, DATABASE_URL, GEMINI_API_KEY

# 5. (Optional) Build the skills taxonomy from O*NET data
#    Download O*NET data files into data/raw/onet/ first (see Skills_Taxonomy_Document.docx)
python -m reskilling.taxonomy
```

### Frontend (one-time setup)
```bash
cd CareerDev

# Install Node dependencies
npm install
```

The `.env` file in `CareerDev/` is already populated with the Supabase credentials and points to `http://localhost:8000` for the API.

---

## Starting Both Servers

Open **two terminal windows** and run:

### Terminal 1 — Backend (FastAPI)
```bash
cd reskilling-platform
.venv\Scripts\activate          # activate venv
uvicorn app_api.main:app --reload --host 0.0.0.0 --port 8000
```

✅ API is ready at: **http://localhost:8000**  
📖 Interactive API docs: **http://localhost:8000/docs**  
🏥 Health check: **http://localhost:8000/health** → `{"status": "ok"}`

### Terminal 2 — Frontend (Vite)
```bash
cd CareerDev
npm run dev
```

✅ UI is ready at: **http://localhost:5173**

---

## Feature Map — What You Can Do

| Page | Route | Backend Endpoint(s) |
|---|---|---|
| Home | `/` | `GET /health`, `GET /taxonomy/stats` |
| Register | `/register` | Supabase auth |
| Login | `/login` | Supabase auth |
| **Dashboard** | `/dashboard` | `/me/career-analyses`, `/me/profile`, `/taxonomy/stats`, `/lrs/statements` |
| **Career Analysis** | `/career-analysis` | `POST /me/career-analysis` |
| **AI Career Guidance** | `/career-guidance` | `POST /me/career-guidance/stream` (SSE + Gemini) |
| **Skill Explorer** | `/skill-explorer` | `GET /occupations`, `GET /taxonomy/requirements` |
| **Learning Roadmap** | `/learning` | `/me/career-analyses`, `POST /skills/resources` |
| **History** | `/history` | `GET /me/career-analyses` |
| **Activity Feed** | `/activity` | `GET /lrs/statements` |
| **Profile** | `/profile` | `GET /me/profile`, `PATCH /me/profile`, `DELETE /me/career-analyses` |
| **Admin Panel** | `/admin` | `GET /admin/users`, `PATCH /admin/users/{id}/role` |

---

## Environment Variables Reference

### Backend (`reskilling-platform/.env`)
```
SUPABASE_URL=https://enxescazwbobjylrsauj.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>        # Required for auth on protected endpoints
DATABASE_URL=postgresql://...                 # Required for persistent analyses
GEMINI_API_KEY=<your-gemini-key>             # Required for /me/career-guidance
CORS_ORIGINS=http://localhost:5173           # Optional: add more allowed origins
```

### Frontend (`CareerDev/.env`)
```
VITE_SUPABASE_URL=https://enxescazwbobjylrsauj.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=http://localhost:8000           # Points to the FastAPI backend
```

---

## Troubleshooting

### "API Offline" badge in the UI
→ The backend is not running. Start `uvicorn app_api.main:app --reload` in Terminal 1.

### 401 Unauthorized on protected routes
→ `SUPABASE_JWT_SECRET` in `reskilling-platform/.env` does not match your Supabase project's JWT secret.  
   Get it from: Supabase Dashboard → Project Settings → Data API → JWT Secret.

### 500 on `/me/career-guidance`
→ `GEMINI_API_KEY` is not set or is invalid.  
   Get a key at: https://aistudio.google.com/apikey

### 500 on `/me/career-analysis` or `/analyze-gap`
→ The spaCy model is not installed. Run: `python -m spacy download en_core_web_md`

### "No occupations found" in Skill Explorer
→ The taxonomy CSV has not been built. Run: `python -m reskilling.taxonomy`  
   (Requires O*NET data files in `data/raw/onet/` — see `Skills_Taxonomy_Document.docx`)

### Database errors
→ `DATABASE_URL` is not set or unreachable.  
   The anonymous endpoints (`/health`, `/occupations`, `/taxonomy/*`, `/extract-skills`, `/analyze-gap`) work without a database. Only `/me/*` endpoints need it.

---

## Architecture Summary

```
Browser  ──Supabase Auth──►  JWT token
  │                              │
  │         CORS allowed         ▼
  └──────► FastAPI :8000 ◄───────┘
              │
              ├── O*NET Taxonomy CSV  (data/processed/)
              ├── spaCy NLP model     (en_core_web_md)
              ├── LRS log             (lrs_log.jsonl)
              ├── Supabase/Postgres   (profiles, analyses)
              └── Gemini API          (career guidance)
```
