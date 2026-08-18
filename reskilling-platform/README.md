# 🧠 AI Reskilling Think Tank Platform

<div align="center">

**Grounded skills-gap analysis and AI-powered reskilling pathways for workers navigating AI-driven automation.**

[![Backend CI](https://github.com/Brian-code-lab/reskilling-platform/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Brian-code-lab/reskilling-platform/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/munenejoel388/CareerDev/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/munenejoel388/CareerDev/actions/workflows/frontend-ci.yml)
[![Deploy](https://github.com/munenejoel388/CareerDev/actions/workflows/deploy.yml/badge.svg)](https://github.com/munenejoel388/CareerDev/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)

[**🚀 Live App**](https://munenejoel388.github.io/CareerDev/) &nbsp;|&nbsp;
[**📖 API Docs**](https://ai-reskilling-api.up.railway.app/docs) &nbsp;|&nbsp;
[**🐛 Report Bug**](https://github.com/Brian-code-lab/reskilling-platform/issues/new?template=bug_report.md) &nbsp;|&nbsp;
[**💡 Request Feature**](https://github.com/Brian-code-lab/reskilling-platform/issues/new?template=feature_request.md)

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Target Users](#-target-users)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Data Flow](#-data-flow)
- [UML Diagrams](#-uml-diagrams)
- [ER Diagram](#-entity-relationship-diagram)
- [API Documentation](#-api-documentation)
- [Installation Guide](#-installation-guide)
- [Docker Quick Start](#-docker-quick-start)
- [Environment Variables](#-environment-variables)
- [Folder Structure](#-folder-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔴 Problem Statement

Automation and AI are reshaping the labour market at an unprecedented pace. Workers in clerical, manufacturing, and routine cognitive roles face displacement, yet lack structured, evidence-based tools to:

- Understand **which specific skills they already have** versus what the target occupation demands
- Receive **personalised, AI-reasoned guidance** rather than generic advice
- Track their **reskilling progress** against a verifiable skills taxonomy grounded in O\*NET / ESCO data

Existing platforms either offer generic career advice without skills evidence, or require institutional access. There is no open, data-driven, AI-augmented reskilling tool built for individual workers.

---

## 💡 Solution

The **AI Reskilling Think Tank Platform** is a full-stack application that:

1. **Extracts skills** from a user's resume using spaCy NLP matched against a curated O\*NET skills taxonomy
2. **Performs gap analysis** — comparing extracted skills to the requirements of any target occupation
3. **Generates a readiness score** and prioritised list of missing skills
4. **Delivers AI career guidance** via Google Gemini with real-time streaming
5. **Recommends learning resources** (courses, certifications) for each skill gap
6. **Logs all activity** to an xAPI-compliant Learning Record Store for auditability

---

## 👥 Target Users

| User Type | Description |
|---|---|
| **Job Seeker** | Individuals facing displacement who want a clear reskilling roadmap |
| **Workforce Analyst** | NGO staff / policy researchers consuming aggregate skills data |
| **Platform Administrator** | Manages taxonomy refreshes, user roles, and system health |

---

## ✨ Key Features

- 📄 **Resume Skill Extraction** — NLP-powered extraction of skills from free-text resumes
- 📊 **Gap Analysis** — Deterministic comparison of your skills vs. any O\*NET occupation
- 🤖 **AI Career Guidance** — Real-time streamed guidance from Google Gemini
- 🗺️ **Learning Roadmap** — Personalised course recommendations per skill gap
- 🔍 **Skill Explorer** — Browse all 900+ O\*NET occupations and their skill requirements
- 📈 **Dashboard** — Career analysis history, progress tracking, xAPI activity feed
- 🔐 **Authentication** — Supabase-backed registration, login, and JWT-protected API
- 🛡️ **Role-Based Access Control** — Job Seeker, Analyst, and Admin roles
- 👑 **Admin Panel** — User management, role assignment
- 📝 **xAPI LRS** — Every significant action is logged to an xAPI-compliant Learning Record Store

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Utility-first styling |
| React Router | 7 | Client-side routing |
| TanStack Query | 5 | Server state management |
| Supabase JS | 2 | Authentication client |
| Lucide React | 1.22 | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.111 | REST API framework |
| uvicorn | 0.30 | ASGI server |
| spaCy | 3.7 | NLP skill extraction (`en_core_web_md`) |
| SQLAlchemy | 2.0 | ORM / database layer |
| PyJWT | 2.9 | JWT verification (offline, no Supabase network call) |
| Google GenAI | 0.3 | Gemini API client for AI career guidance |
| Pandas | 2.2 | Skills taxonomy processing |
| scikit-learn | 1.4 | Similarity scoring for skill matching |
| Ruff | latest | Linting & formatting |
| pytest | latest | 86-test automated test suite |

### Database & Auth
| Technology | Purpose |
|---|---|
| Supabase | Hosted PostgreSQL + Row Level Security + Auth |
| PostgreSQL | Persistent storage for profiles, analyses, xAPI statements |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| GitHub Actions | CI/CD pipelines |
| GitHub Pages | Frontend hosting |
| Railway | Backend hosting (Docker-native) |
| Nginx | Static file serving + SPA routing |

### External Data Sources
| Source | Usage |
|---|---|
| O\*NET | Skills taxonomy (900+ occupations, 35,000+ skill requirements) |
| ESCO | European skills/competences framework cross-reference |
| BLS | Bureau of Labour Statistics labour market trends |
| ILO | International Labour Organisation occupation data |

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph client["🖥️ Client Layer"]
        browser["Browser"]
    end

    subgraph frontend["⚛️ Frontend — React/Vite (GitHub Pages)"]
        react["React 19 + TypeScript"]
        supabase_js["Supabase JS Client\n(auth only)"]
        tanstack["TanStack Query\n(server state)"]
    end

    subgraph backend["🐍 Backend — FastAPI (Railway)"]
        api["FastAPI REST API\napp_api/main.py"]
        auth_mid["JWT Auth Middleware\napp_api/auth.py"]
        rate_mid["Rate Limiter\napp_api/rate_limit.py"]
    end

    subgraph core["🧠 Core — Python Business Logic"]
        nlp["nlp.py\nspaCy Skill Extraction"]
        recommender["recommender.py\nGap Analysis Engine"]
        llm["llm_reasoning.py\nGemini AI Guidance"]
        lrs["lrs.py\nxAPI LRS Logger"]
        db["db.py\nSQLAlchemy ORM"]
        taxonomy["taxonomy.py\nO*NET Taxonomy Builder"]
        resources["resources.py\nLearning Resource Recommender"]
        schemas["schemas.py\nShared Data Contracts"]
    end

    subgraph external["☁️ External Services"]
        supabase_db[("Supabase\nPostgreSQL + RLS")]
        gemini["Google Gemini API\nAI Career Reasoning"]
        onet["O*NET Data\nskills_taxonomy_v1.csv"]
    end

    browser --> react
    react --> supabase_js
    react --> tanstack
    tanstack --> api
    supabase_js -.auth tokens only.- supabase_db

    api --> auth_mid
    api --> rate_mid
    api --> recommender
    api --> lrs
    api -.lazy import.- nlp
    api -.lazy import.- db
    api -.lazy import.- llm

    recommender --> schemas
    nlp --> schemas
    db --> supabase_db
    llm --> gemini
    taxonomy -.builds.- onet

    style client fill:#1a1a2e,color:#eee
    style frontend fill:#16213e,color:#eee
    style backend fill:#0f3460,color:#eee
    style core fill:#533483,color:#eee
    style external fill:#2d2d2d,color:#eee
```

### Deployment Architecture

```mermaid
graph LR
    subgraph github["GitHub"]
        repo["Repository\nBrian-code-lab/ai-reskilling-platform"]
        actions["GitHub Actions\nCI/CD Pipelines"]
        pages["GitHub Pages\nFrontend Hosting"]
    end

    subgraph railway["Railway"]
        railway_svc["FastAPI Container\nDocker-deployed"]
    end

    subgraph supabase["Supabase Cloud"]
        pg[("PostgreSQL\nprofiles + analyses")]
        auth_svc["Auth Service\nJWT issuance"]
    end

    subgraph google["Google Cloud"]
        gemini_api["Gemini 1.5 Flash\nAI Career Guidance"]
    end

    repo --> actions
    actions -->|"npm run build + deploy"| pages
    actions -->|"Docker push + deploy"| railway
    pages -->|"HTTPS API calls"| railway_svc
    railway_svc --> pg
    railway_svc --> gemini_api
    pages -->|"Auth token exchange"| auth_svc
    auth_svc --> pg
```

---

## 🔄 Data Flow

### Career Analysis Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant Supabase as Supabase Auth
    participant API as FastAPI Backend
    participant NLP as spaCy NLP Engine
    participant Rec as Gap Analyser
    participant DB as PostgreSQL
    participant LRS as xAPI LRS
    participant Gemini as Google Gemini

    User->>FE: Paste resume text + select target occupation
    FE->>Supabase: Get JWT token
    Supabase-->>FE: JWT
    FE->>API: POST /me/career-analysis {resume, occupation_id}
    API->>API: Verify JWT (offline, no network call)
    API->>NLP: extract_skills(resume_text)
    NLP-->>API: List[SkillMatch] with confidence scores
    API->>Rec: analyze_gap(user_skills, occupation_requirements)
    Rec-->>API: GapAnalysisResult {readiness_score, missing_skills, matched_skills}
    API->>DB: INSERT career_analyses (user_id, result)
    DB-->>API: analysis_id
    API->>LRS: log_gap_analysis_event(user_id, occupation, score)
    LRS-->>API: xAPI statement logged
    API-->>FE: CareerAnalysisResponse {score, gaps, matches}
    FE-->>User: Dashboard with readiness score + skill gaps

    User->>FE: Request AI Career Guidance
    FE->>API: POST /me/career-guidance/stream
    API->>Gemini: Stream reasoning prompt (skills context)
    Gemini-->>API: Streamed token chunks
    API-->>FE: Server-Sent Events stream
    FE-->>User: Real-time AI guidance text
```

### Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant Supabase as Supabase Auth
    participant API as FastAPI Backend

    User->>FE: Enter email + password
    FE->>Supabase: signInWithPassword()
    Supabase-->>FE: {access_token (JWT), user}
    FE->>FE: Store JWT in memory (not localStorage)
    FE->>API: GET /me/profile (Authorization: Bearer <JWT>)
    API->>API: Decode + verify JWT with SUPABASE_JWT_SECRET
    API->>API: Extract user_id, role from JWT claims
    API-->>FE: UserProfile {id, email, role, full_name}
    FE-->>User: Redirect to /dashboard
```

---

## 📐 UML Diagrams

### Use Case Diagram

```mermaid
graph LR
    JS((Job Seeker))
    WA((Workforce\nAnalyst))
    PA((Platform\nAdmin))

    uc1([Upload Resume])
    uc2([View Extracted Skills])
    uc3([Select Target Occupation])
    uc4([Run Gap Analysis])
    uc5([View Readiness Score])
    uc6([Get AI Career Guidance])
    uc7([Browse Skill Explorer])
    uc8([View Learning Roadmap])
    uc9([Track Activity History])
    uc10([Manage Profile])
    uc11([View Labour Market Trends])
    uc12([Manage Users & Roles])
    uc13([Refresh Skills Taxonomy])

    JS --> uc1
    JS --> uc2
    JS --> uc3
    JS --> uc4
    JS --> uc5
    JS --> uc6
    JS --> uc7
    JS --> uc8
    JS --> uc9
    JS --> uc10

    WA --> uc7
    WA --> uc11
    WA --> uc9

    PA --> uc12
    PA --> uc13

    uc4 -.includes.- uc2
    uc4 -.includes.- uc3
    uc5 -.includes.- uc4
    uc6 -.extends.- uc4
```

### Component Diagram

```mermaid
graph TD
    subgraph fe["⚛️ CareerDev — React Frontend"]
        direction TB
        router["React Router\n(routes/)"]
        pages_fe["Pages\n(pages/)"]
        components["Shared Components\n(components/)"]
        context["Auth Context\n(context/)"]
        services["API Service Layer\n(services/)"]
        types["TypeScript Types\n(types/)"]
    end

    subgraph api["🐍 app_api — FastAPI Service"]
        main_py["main.py\nREST endpoints"]
        auth_py["auth.py\nJWT middleware"]
        ratelimit_py["rate_limit.py\nIn-memory throttle"]
    end

    subgraph core_py["🧠 src/reskilling — Business Logic"]
        taxonomy_py["taxonomy.py\nO*NET builder"]
        nlp_py["nlp.py\nSpaCy extractor"]
        recommender_py["recommender.py\nGap analyser"]
        schemas_py["schemas.py\nShared contracts"]
        lrs_py["lrs.py\nxAPI LRS"]
        db_py["db.py\nSQLAlchemy ORM"]
        llm_py["llm_reasoning.py\nGemini client"]
        resources_py["resources.py\nLearning links"]
    end

    subgraph storage["💾 Persistence"]
        pg_db[("PostgreSQL\nSupabase")]
        csv_file[("skills_taxonomy_v1.csv")]
        lrs_log[("lrs_log.jsonl\nxAPI statements")]
    end

    router --> pages_fe
    pages_fe --> components
    pages_fe --> services
    pages_fe --> context
    services --> main_py

    main_py --> auth_py
    main_py --> ratelimit_py
    main_py --> recommender_py
    main_py --> lrs_py
    main_py -.lazy.- nlp_py
    main_py -.lazy.- db_py
    main_py -.lazy.- llm_py
    main_py --> resources_py

    recommender_py --> schemas_py
    nlp_py --> schemas_py
    taxonomy_py -.writes.- csv_file
    recommender_py -.reads.- csv_file
    db_py --> pg_db
    lrs_py -.writes.- lrs_log
```

### Class Diagram (Core Domain)

```mermaid
classDiagram
    class SkillMatch {
        +str skill_id
        +str skill_name
        +float confidence
        +str source
    }

    class GapAnalysisResult {
        +float readiness_score
        +List~SkillMatch~ matched_skills
        +List~str~ missing_skill_ids
        +str occupation_id
        +str occupation_title
    }

    class CareerAnalysis {
        +UUID id
        +UUID user_id
        +str occupation_id
        +float readiness_score
        +JSON result_json
        +datetime created_at
    }

    class UserProfile {
        +UUID id
        +str email
        +str full_name
        +str role
        +datetime created_at
    }

    class XAPIStatement {
        +str actor_email
        +str verb
        +str object_id
        +JSON result
        +datetime timestamp
    }

    class SkillExtractor {
        +nlp: spacy.Language
        +taxonomy_df: DataFrame
        +extract(resume_text: str) List~SkillMatch~
        -_match_skills(doc) List~SkillMatch~
    }

    class ReskillingRecommender {
        +taxonomy_df: DataFrame
        +analyze_gap(user_skills, occupation_id) GapAnalysisResult
        +get_occupation_requirements(occupation_id) List~str~
    }

    class LRS {
        +log_path: Path
        +log_gap_analysis_event(user_id, occupation, score) XAPIStatement
        +log_resume_upload_event(user_id) XAPIStatement
        +get_statements(user_id) List~XAPIStatement~
    }

    SkillExtractor ..> SkillMatch : produces
    ReskillingRecommender ..> GapAnalysisResult : produces
    ReskillingRecommender ..> SkillMatch : consumes
    GapAnalysisResult --> SkillMatch
    CareerAnalysis --> GapAnalysisResult : serialises
    LRS ..> XAPIStatement : produces
    UserProfile "1" --> "*" CareerAnalysis : owns
```

### State Diagram — Career Analysis Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticated : Login / Register

    Authenticated --> ResumeEntry : Navigate to Career Analysis
    ResumeEntry --> OccupationSelected : Select target occupation
    OccupationSelected --> Analysing : Submit for analysis

    Analysing --> AnalysisFailed : API error / spaCy unavailable
    Analysing --> AnalysisComplete : Gap analysis returned

    AnalysisFailed --> ResumeEntry : Retry

    AnalysisComplete --> ViewingResults : Auto-redirect to results
    ViewingResults --> RequestingGuidance : Click "Get AI Guidance"
    RequestingGuidance --> GuidanceStreaming : SSE stream starts
    GuidanceStreaming --> GuidanceComplete : Stream ends
    GuidanceComplete --> ViewingRoadmap : Navigate to Learning Roadmap

    ViewingResults --> ViewingRoadmap : Navigate to Learning
    ViewingRoadmap --> [*]
```

### User Journey Diagram

```mermaid
journey
    title Job Seeker Reskilling Journey
    section Discovery
        Visit platform homepage: 5: Job Seeker
        Read about features: 4: Job Seeker
        Click "Get Started": 5: Job Seeker
    section Registration
        Create account with email: 3: Job Seeker
        Verify email: 2: Job Seeker
        Complete profile: 4: Job Seeker
    section First Analysis
        Paste resume text: 4: Job Seeker
        Select target occupation: 3: Job Seeker
        Submit for gap analysis: 5: Job Seeker
        View readiness score: 5: Job Seeker
        Review missing skills: 4: Job Seeker
    section AI Guidance
        Request AI career advice: 5: Job Seeker
        Read streamed guidance: 5: Job Seeker
        Save guidance notes: 3: Job Seeker
    section Learning
        Open Learning Roadmap: 5: Job Seeker
        Browse recommended courses: 4: Job Seeker
        Enrol in course externally: 3: Job Seeker
    section Tracking
        Return for second analysis: 4: Job Seeker
        Compare scores over time: 5: Job Seeker
        View xAPI activity feed: 3: Job Seeker
```

---

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    USER_PROFILES {
        uuid id PK
        text email
        text full_name
        text role
        timestamp created_at
        timestamp updated_at
    }

    CAREER_ANALYSES {
        uuid id PK
        uuid user_id FK
        text occupation_id
        text occupation_title
        float readiness_score
        jsonb result_json
        timestamp created_at
    }

    SKILL_MATCHES {
        uuid id PK
        uuid analysis_id FK
        text skill_id
        text skill_name
        float confidence
        text match_type
    }

    LEARNING_RESOURCES {
        uuid id PK
        text skill_id FK
        text title
        text url
        text provider
        text resource_type
    }

    XAPI_STATEMENTS {
        uuid id PK
        uuid user_id FK
        text verb
        text object_id
        jsonb result
        timestamp timestamp
    }

    USER_PROFILES ||--o{ CAREER_ANALYSES : "owns"
    CAREER_ANALYSES ||--o{ SKILL_MATCHES : "contains"
    SKILL_MATCHES }o--o{ LEARNING_RESOURCES : "recommends"
    USER_PROFILES ||--o{ XAPI_STATEMENTS : "generates"
```

---

## 📡 API Documentation

Base URL: `https://ai-reskilling-api.up.railway.app`  
Interactive docs: `/docs` (Swagger UI) · `/redoc` (ReDoc)

### Authentication
All `/me/*` and `/admin/*` endpoints require:
```
Authorization: Bearer <supabase-jwt-token>
```

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check → `{"status":"ok"}` |
| `GET` | `/taxonomy/stats` | Occupation count, skill count totals |
| `GET` | `/occupations` | List all 900+ O\*NET occupations |
| `GET` | `/taxonomy/requirements` | Skill requirements for any occupation |
| `POST` | `/extract-skills` | Extract skills from resume text (spaCy) |
| `POST` | `/analyze-gap` | Anonymous gap analysis (not persisted) |

### Protected Endpoints (auth required)

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/me/profile` | Any | Get own profile |
| `PATCH` | `/me/profile` | Any | Update own profile |
| `POST` | `/me/career-analysis` | Any | Run + persist career analysis |
| `GET` | `/me/career-analyses` | Any | List own analyses |
| `DELETE` | `/me/career-analyses/{id}` | Any | Delete own analysis |
| `POST` | `/me/career-guidance/stream` | Any | SSE-streamed Gemini guidance |
| `GET` | `/lrs/statements` | Any | Own xAPI learning record |
| `POST` | `/skills/resources` | Any | Learning resource recommendations |
| `GET` | `/admin/users` | Admin | List all users |
| `PATCH` | `/admin/users/{id}/role` | Admin | Update user role |

### Example Request / Response

```bash
# Run a career analysis
curl -X POST https://ai-reskilling-api.up.railway.app/me/career-analysis \
  -H "Authorization: Bearer <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "5 years Python, data analysis, SQL...",
    "occupation_id": "15-2051.00"
  }'
```

```json
{
  "analysis_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "occupation_title": "Data Scientists",
  "readiness_score": 0.72,
  "matched_skills": [
    {"skill_id": "2.C.7.a", "skill_name": "Programming", "confidence": 0.91}
  ],
  "missing_skills": ["Machine Learning", "Statistical Analysis", "R"],
  "created_at": "2026-07-24T16:00:00Z"
}
```

---

## 🚀 Installation Guide

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Git | Any | [git-scm.com](https://git-scm.com/) |
| Python | ≥ 3.11 | [python.org](https://www.python.org/) |
| Node.js | ≥ 22 | [nodejs.org](https://nodejs.org/) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/) |

### Clone

```bash
git clone https://github.com/Brian-code-lab/ai-reskilling-platform.git
cd ai-reskilling-platform
```

---

## 🐳 Docker Quick Start

> **Recommended** — no manual Python/Node installation needed.

```bash
# 1. Copy and fill in env vars
cp .env.example .env
# Edit .env with your Supabase URL, keys, and Gemini API key

# 2. Start everything
docker compose up

# 3. Visit
#   Frontend:  http://localhost:80
#   API:       http://localhost:8000
#   API Docs:  http://localhost:8000/docs
```

To rebuild after code changes:
```bash
docker compose up --build
```

---

## ⚙️ Manual Installation

### Backend (FastAPI)

```bash
cd reskilling-platform

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac / Linux

# Install dependencies
pip install -e ".[dev]"

# Download spaCy NLP model
python -m spacy download en_core_web_md

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# (Optional) Build skills taxonomy from O*NET data
# Download O*NET files into data/raw/onet/ first
python -m reskilling.taxonomy

# Run tests
pytest -v   # Should show 86 tests passing

# Start API server
uvicorn app_api.main:app --reload --host 0.0.0.0 --port 8000
```

API ready at: `http://localhost:8000`  
Swagger docs at: `http://localhost:8000/docs`

### Frontend (React/Vite)

```bash
cd CareerDev

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase keys and API URL

# Start dev server
npm run dev
```

UI ready at: `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (`reskilling-platform/.env`)

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL | Supabase Dashboard → Settings → Data API |
| `SUPABASE_ANON_KEY` | ✅ | Public API key | Supabase Dashboard → Settings → Data API |
| `SUPABASE_JWT_SECRET` | ✅ | JWT verification secret | Supabase Dashboard → Settings → Data API → JWT Secret |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `GEMINI_API_KEY` | ⚠️ | Google Gemini API key (for AI guidance) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `CORS_ORIGINS` | Optional | Extra allowed origins (comma-separated) | Set to your deployed frontend URL |

### Frontend (`CareerDev/.env`)

| Variable | Required | Description | Where to Get |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL | Supabase Dashboard → Settings → Data API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public API key | Supabase Dashboard → Settings → Data API |
| `VITE_API_URL` | ✅ | FastAPI backend URL | `http://localhost:8000` (dev) or Railway URL (prod) |

> ⚠️ **Never commit `.env` files.** Only `.env.example` templates are safe to commit. Real credentials must be added to **GitHub Actions Secrets** for CI/CD deployment.

---

## 📁 Folder Structure

```
ai-reskilling-platform/
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml         # Python tests + ruff linting
│   │   ├── frontend-ci.yml        # TypeScript + oxlint + build
│   │   ├── docker-build.yml       # Docker image build verification
│   │   └── deploy.yml             # Deploy frontend to GitHub Pages
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── reskilling-platform/           # 🐍 Python Backend
│   ├── app_api/                   # FastAPI service layer
│   │   ├── main.py                # REST endpoints (657 lines)
│   │   ├── auth.py                # JWT middleware
│   │   └── rate_limit.py          # In-memory rate limiting
│   ├── src/reskilling/            # Core business logic
│   │   ├── taxonomy.py            # O*NET taxonomy builder
│   │   ├── nlp.py                 # spaCy skill extractor
│   │   ├── recommender.py         # Gap analysis engine
│   │   ├── schemas.py             # Shared data contracts
│   │   ├── lrs.py                 # xAPI LRS logger
│   │   ├── db.py                  # SQLAlchemy ORM layer
│   │   ├── llm_reasoning.py       # Gemini AI client
│   │   └── resources.py           # Learning resource recommender
│   ├── app/                       # Streamlit frontend (anonymous demo)
│   ├── web/                       # Next.js frontend (historical)
│   ├── tests/                     # 86 automated tests
│   │   ├── test_api.py
│   │   ├── test_auth.py
│   │   ├── test_llm_reasoning.py
│   │   ├── test_lrs.py
│   │   ├── test_rate_limit.py
│   │   ├── test_recommender.py
│   │   └── test_resources.py
│   ├── db/migrations/             # PostgreSQL schema migrations (001-005)
│   ├── docs/                      # Architecture documentation
│   ├── data/                      # O*NET raw + processed data
│   ├── Dockerfile                 # Backend container
│   ├── .dockerignore
│   ├── pyproject.toml             # Python package config
│   └── .env.example               # Environment template
│
├── CareerDev/                     # ⚛️ React Frontend
│   ├── src/
│   │   ├── components/            # Shared UI components
│   │   ├── pages/                 # Route-level page components
│   │   ├── routes/                # React Router config
│   │   ├── context/               # Auth context provider
│   │   ├── services/              # API service layer
│   │   └── types/                 # TypeScript type definitions
│   ├── public/                    # Static assets
│   ├── .github/workflows/         # Frontend-specific workflows
│   ├── Dockerfile                 # Frontend container (nginx)
│   ├── nginx.conf                 # SPA routing config
│   ├── .dockerignore
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example               # Environment template
│
├── docs/                          # 📖 Project documentation
│   ├── ARCHITECTURE.md            # Detailed architecture docs
│   ├── API.md                     # Complete API reference
│   └── DEPLOYMENT.md              # Deployment guide
│
├── docker-compose.yml             # 🐳 Full stack orchestration
├── .env.example                   # Root env template (docker-compose)
├── .gitignore                     # Root gitignore
├── CONTRIBUTING.md                # Contribution guidelines
├── CHANGELOG.md                   # Version history
├── LICENSE                        # MIT License
├── RUNNING.md                     # Quick start guide
└── README.md                      # This file
```

---

## 🤝 Contributing

We follow **Conventional Commits** and **GitHub Flow**. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

### Branch Strategy

```
main          ← production-ready, protected (PR required)
  └─ feature/<name>   ← new features
  └─ fix/<name>        ← bug fixes
  └─ docs/<name>       ← documentation updates
  └─ refactor/<name>   ← code improvements
```

### Commit Convention

```
feat: add AI career guidance streaming
fix: resolve JWT expiry edge case
docs: update API documentation
refactor: simplify gap analysis scoring
test: add coverage for rate limiter
chore: upgrade spaCy to 3.8
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

<div align="center">

Built with ❤️ to help workers navigate AI-driven change.

**[🚀 Try the App](https://munenejoel388.github.io/CareerDev/)** · **[📖 API Docs](https://ai-reskilling-api.up.railway.app/docs)** · **[🐛 Report an Issue](https://github.com/Brian-code-lab/reskilling-platform/issues)**

</div>
