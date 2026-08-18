# Changelog

All notable changes to the AI Reskilling Think Tank Platform are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Professional README with 9 Mermaid diagrams (architecture, deployment, sequence, use case, component, class, state, user journey, ER diagram)
- Docker containerization (`Dockerfile` for backend and frontend, `docker-compose.yml`)
- CI/CD GitHub Actions workflows (backend CI, frontend CI, Docker build verification, GitHub Pages deploy)
- GitHub PR template and issue templates (bug report, feature request)
- `CONTRIBUTING.md` with branching strategy and Conventional Commits guide
- `docs/DEPLOYMENT.md` with Railway + GitHub Pages deployment walkthrough
- `docs/API.md` full API reference
- Root `.gitignore` and `.env.example` for docker-compose

---

## [0.2.0] — Phase E Complete (2026-07)

### Added
- **CareerDev frontend** — React 19 + TypeScript + Vite + Tailwind v4
  - Registration, login, and Supabase-backed authentication
  - Dashboard with career analysis history and progress tracking
  - Career Analysis page with resume upload and occupation selection
  - AI Career Guidance page with real-time Gemini SSE streaming
  - Skill Explorer browsing all 900+ O\*NET occupations
  - Learning Roadmap with per-skill course recommendations
  - History and Activity Feed pages
  - Profile management page
  - Admin Panel for user management and role assignment
- `VITE_API_URL` configuration pointing to FastAPI backend
- `RUNNING.md` complete startup guide (both servers)

### Fixed
- Supabase client crash on empty config (graceful degradation)

---

## [0.1.5] — Phase D: AI Career Reasoning (2026-07)

### Added
- `src/reskilling/llm_reasoning.py` — Google Gemini client for AI career guidance
- `POST /me/career-guidance/stream` — Server-Sent Events endpoint with real-time Gemini streaming
- `test_llm_reasoning.py` — 12 tests with mocked Gemini client

---

## [0.1.4] — Phase C: Supabase Integration (2026-07)

### Added
- `src/reskilling/db.py` — SQLAlchemy ORM layer for PostgreSQL (Supabase)
- Persistent storage for: user profiles, career analyses, xAPI statements
- `db/migrations/` — 5 PostgreSQL schema migrations (001–005)
- `SUPABASE_JWT_SECRET` offline JWT verification (no network call to Supabase)
- Row Level Security policies applied via migrations
- `GET /me/profile`, `PATCH /me/profile` endpoints
- `GET/DELETE /me/career-analyses` endpoints

---

## [0.1.3] — Phase B: Next.js Frontend (Historical) (2026-07)

### Added
- `web/` — Next.js frontend with role-aware dashboard (historical, superseded by CareerDev)
- Admin user management UI
- Sign-in flow with Supabase Auth

---

## [0.1.2] — Phase A: FastAPI Service Layer (2026-07)

### Added
- `app_api/main.py` — FastAPI REST service wrapping `src/reskilling/` core (657 lines)
- `app_api/auth.py` — JWT middleware with offline Supabase token verification
- `app_api/rate_limit.py` — In-memory rate limiting
- `POST /extract-skills` — Resume skill extraction endpoint
- `POST /analyze-gap` — Anonymous gap analysis endpoint
- `GET /occupations`, `GET /taxonomy/*` — Taxonomy query endpoints
- `GET /health` — Health check endpoint
- `GET /lrs/statements` — xAPI statement retrieval
- CORS configuration for Vite (5173) and Next.js (3000) dev servers
- `test_api.py` (35 tests), `test_auth.py` (8 tests), `test_rate_limit.py` (9 tests)

### Fixed
- `pip install -e .` was previously broken due to `build-backend` misconfiguration and `app_api/` not being registered — both fixed and verified with a clean virtual environment

---

## [0.1.1] — Phase 3: LRS + Recommender Decoupling (2026-06)

### Added
- `src/reskilling/lrs.py` — xAPI-compliant Learning Record Store (JSONL)
- `src/reskilling/resources.py` — Learning resource recommendations per skill gap
- `src/reskilling/schemas.py` — Shared `SkillMatch` dataclass extracted to break `nlp.py ↔ recommender.py` coupling
- `test_lrs.py`, `test_resources.py`, `test_recommender.py`

### Changed
- `recommender.py` now imports `SkillMatch` from `schemas.py`, not `nlp.py` — eliminates spaCy as a transitive dependency for gap-analysis-only code paths

---

## [0.1.0] — Phase 1–2: Core NLP + Taxonomy (2026-06)

### Added
- `src/reskilling/taxonomy.py` — O\*NET skills taxonomy builder → `data/processed/skills_taxonomy_v1.csv`
- `src/reskilling/nlp.py` — spaCy `en_core_web_md` skill extractor with confidence scoring
- `src/reskilling/recommender.py` — Deterministic gap analysis engine with readiness scoring
- `app/streamlit_app.py` — Streamlit frontend (anonymous demo, no login required)
- `pyproject.toml` — Python package configuration
- Initial test suite

---

[Unreleased]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Brian-code-lab/ai-reskilling-platform/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Brian-code-lab/ai-reskilling-platform/releases/tag/v0.1.0
