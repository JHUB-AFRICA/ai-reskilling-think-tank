# PRJ01: Project Charter

| Field | Details |
| :--- | :--- |
| **Document Code** | `PRJ01_ProjectCharter_v1.0_2026-07-01` |
| **Project Name** | AI Reskilling Think Tank Platform |
| **Date Created** | 2026-07-01 |
| **Version** | v1.0 |
| **Authors** | Brian & Joel Munene |
| **Supervisors** | Brian & Keith |

---

## 1. Project Summary
The AI Reskilling Think Tank Platform is an open-access, full-stack application that extracts skills from worker resumes using spaCy NLP, performs deterministic gap analyses against 900+ O*NET occupations, delivers real-time AI career guidance via Google Gemini streaming, and logs activity to an xAPI Learning Record Store.

## 2. Problem & Goal
* **Problem:** Automation and AI are displacing routine workers who lack data-grounded tools to assess their transferable skills and receive structured reskilling pathways.
* **Goal:** Deliver a production-grade, fast ($<200\text{ms}$ read latency), user-friendly web platform with 100% test-verified skills extraction and career reasoning.

## 3. Team & Role Matrix
* **Brian:** Lead Backend Engineer & Data Lead (FastAPI, spaCy NLP, SQLAlchemy, PyJWT, Gemini API).
* **Joel Munene:** Lead Frontend Engineer & UI/UX Designer (React 19, Vite, TypeScript, Tailwind CSS v4).
* **Brian & Keith:** Project Supervisors (Architecture review, milestone evaluation, final grading).

## 4. Key Deliverables
1. FastAPI REST Backend with 15+ endpoints.
2. React 19 Frontend Web Application (`CareerDev`).
3. Supabase PostgreSQL database schemas & offline JWT authentication.
4. xAPI Learning Record Store (JSONL).
5. 86-test automated pytest suite.

## 5. Timeline & Milestones
* **Start Date:** July 1, 2026
* **Completion Target:** August 13, 2026
* **Duration:** 8 Weeks

## 6. Resources & Tools
* Python 3.11, FastAPI, spaCy (`en_core_web_md`), PyJWT, Google Gemini API, React 19, Vite 8, Tailwind CSS 4, Supabase PostgreSQL, Docker.
