# PRJ01: System Documentation & Architecture Overview

## 1. System Overview
The **AI Reskilling Think Tank Platform** is a full-stack application designed to help workers analyze personal resume skills against 900+ O*NET occupations, identify skill gaps, and receive real-time AI career guidance paired with curated learning roadmaps.

```
[Job Seeker / User] ──► [React 19 Frontend (CareerDev)]
                               │ (REST API / SSE)
                               ▼
                    [FastAPI Backend (Port 8000)]
                     ├── JWT Auth Middleware (PyJWT)
                     ├── spaCy NLP Skill Extractor
                     ├── Scikit-Learn Gap Recommender
                     ├── Google Gemini AI Streaming
                     └── xAPI Learning Record Store
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Supabase PostgreSQL DB]                [O*NET Taxonomy Data]
```

## 2. Main Components

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript + Vite | SPA web client (`/CareerDev`) with dark glassmorphic design. |
| **Backend REST API** | FastAPI + Python 3.11 | High-performance REST service (`/reskilling-platform/app_api`). |
| **Skill Extractor** | spaCy (`en_core_web_md`) | Noun-phrase NLP engine extracting skills from resume text. |
| **Gap Recommender** | scikit-learn + pandas | Deterministic gap analysis engine comparing user skills to O*NET targets. |
| **AI Streaming** | Google Gemini API | Real-time Server-Sent Events (SSE) career guidance endpoint. |
| **Database** | Supabase PostgreSQL | Stores user profiles, historical gap analyses, and auth state. |
| **LRS Engine** | Custom xAPI Logger | Append-only JSONL log of user learning events. |

## 3. How to Set Up & Run

```bash
# 1. Start Backend API
cd reskilling-platform
pip install -e ".[dev]"
python -m spacy download en_core_web_md
uvicorn app_api.main:app --reload --port 8000

# 2. Start Frontend UI
cd CareerDev
npm install
npm run dev
```

Visit application at `http://localhost:5173`.
