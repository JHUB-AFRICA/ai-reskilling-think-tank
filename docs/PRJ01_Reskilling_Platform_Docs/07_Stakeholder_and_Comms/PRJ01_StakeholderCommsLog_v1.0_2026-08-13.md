# PRJ01: Stakeholder & Communication Log

## 1. Meeting Log

| Date | Attendees | Key Topics Discussed | Decisions Made | Action Items & Owner |
| :--- | :--- | :--- | :--- | :--- |
| **2026-07-01** | Brian, Joel, Keith | Project Kickoff & Charter Review | Approved project scope and core requirements. | Set up GitHub Repo (Brian) |
| **2026-07-15** | Brian, Joel | Architecture Review: Backend API | Decoupled schema contracts from NLP engine. | Refactor `schemas.py` (Brian) |
| **2026-07-29** | Brian, Joel, Keith | Mid-Term Progress Demo | Approved frontend shift to `CareerDev` (React 19). | Initialize React repo (Joel) |
| **2026-08-12** | Brian, Joel, Keith | Final Review & Handover Audit | Verified 86 passing tests & documentation. | Prepare final report (All) |

## 2. Assumptions Log

* **A-01:** Users upload standard resume text in English. (Status: Confirmed).
* **A-02:** Supabase Auth is the single source of user identity. (Status: Confirmed).
* **A-03:** Read performance under 200ms is sufficient for taxonomy lookups. (Status: Confirmed & verified).

## 3. Feedback Log

| Date | Feedback Received | From | Action Taken | Status |
| :--- | :--- | :--- | :--- | :--- |
| **2026-07-20** | Add latency logging for API endpoints. | Keith | Added `X-Response-Time-Ms` middleware. | Completed |
| **2026-08-05** | Add UI status indicator for API connection. | Brian | Implemented `ApiStatusBadge.tsx`. | Completed |
