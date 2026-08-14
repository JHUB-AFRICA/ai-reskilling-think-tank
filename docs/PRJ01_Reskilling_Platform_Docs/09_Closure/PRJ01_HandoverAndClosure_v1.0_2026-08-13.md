# PRJ01: Project Handover & Closure Document

## 1. Handover Overview
This document provides all operational details necessary for future engineers or project maintainers to take full ownership of the **AI Reskilling Think Tank Platform**.

## 2. File & Directory Locations
* **Root Repository:** `d:\ai project\New folder\files\reskilling-platform-complete`
* **FastAPI Backend:** `reskilling-platform/`
* **React 19 Frontend:** `CareerDev/`
* **Taxonomy Data Files:** `reskilling-platform/data/skills_taxonomy_v1.csv`
* **Test Suite:** `reskilling-platform/tests/`

## 3. Account & Service Accounts
* **Supabase Project:** Configured via `SUPABASE_URL` and `SUPABASE_JWT_SECRET`.
* **Google Gemini API:** Configured via `GEMINI_API_KEY`.
* *Note: Passwords and keys must be securely requested from supervisors Brian or Keith.*

## 4. Current State & Immediate Next Steps
* **Current State:** 100% functional, 86 unit/integration tests passing, CORS configured, full Docker setup verified.
* **Immediate Maintenance Items:**
  1. Audit Google Gemini API usage quotas periodically.
  2. Refresh O*NET taxonomy CSV when annual updates are released by BLS/O*NET.
