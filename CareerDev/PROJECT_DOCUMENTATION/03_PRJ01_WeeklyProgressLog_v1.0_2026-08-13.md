# PRJ01: Weekly Progress Log

| Date | Task Worked On | Progress / Status | Blockers Encountered | Next Steps |
| :--- | :--- | :--- | :--- | :--- |
| **Week 1 (Jul 01 - Jul 07)** | Project Setup & O*NET Data Ingestion | Completed O*NET CSV parsing & taxonomy data pipeline | None | Build spaCy NLP skill extractor |
| **Week 2 (Jul 08 - Jul 14)** | Core NLP & Recommender Engine | Built `nlp.py` & `recommender.py`; achieved 100% test pass on gap scoring | spaCy model download latency in CI | Add xAPI LRS logging |
| **Week 3 (Jul 15 - Jul 21)** | xAPI LRS & Decoupling | Created `lrs.py` and decoupled schemas (`schemas.py`) | Cyclical import between NLP & Recommender | Build FastAPI layer (`app_api`) |
| **Week 4 (Jul 22 - Jul 28)** | FastAPI Service & Offline Auth | Implemented REST routes & PyJWT offline auth middleware | Supabase remote auth API response delay (300ms) | Add rate limiting & Gemini client |
| **Week 5 (Jul 29 - Aug 04)** | AI Guidance & Backend CI | Integrated Google Gemini SSE streaming (`/me/career-guidance/stream`) | Gemini API rate limits | Build React 19 frontend (`CareerDev`) |
| **Week 6 (Aug 05 - Aug 08)** | Frontend CareerDev UI | Created 5-step Career Analysis wizard, Skill Explorer, LRS Feed | CORS headers blocked Vite dev server | Add Admin Panel & link API status |
| **Week 7 (Aug 09 - Aug 11)** | Integration & CORS Fix | Connected frontend `apiClient.ts` to backend; added `CORSMiddleware` | Local environment variable sync | Run automated test suite & docker build |
| **Week 8 (Aug 12 - Aug 13)** | Full Verification & Docs | Verified all 86 pytest cases, Docker compose, and completed full docs | None | Project handover & final submission |
