**🧠 PRJ01: AI Reskilling Think Tank Platform — Master Project Documentation**

> ***Document Code:** PRJ01_Master_Project_Documentation_v1.0_2026-08-13*
>
> ***Project Title:** AI Reskilling Think Tank Platform*
>
> ***Author:** Intern Development Team*
>
> *Justus Mwenda*
>
> *Brian Mwangi*
>
> *Joel Munene*
>
> *Joseph Momanyi*
>
> *Zachariah Nyachoti*
>
> ***Supervisors:** DR Lawrence Nderu*
>
> ***Date of Last Update:** 2026-08-13*
>
> ***Status:** Completed / Ready for Handover & Evaluation*

**📋 Version Changelog**

| **Version** | **Date**   | **Author**                              | **Summary of Changes**                                                                                                              |
|-------------|------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| **v0.1**    | 2026-07-01 | Justus, Brian, Joel, Joseph & Zachariah | Initial project setup, project charter, requirements definition, team roles and development environment configuration.              |
| **v0.2**    | 2026-07-08 | Justus, Brian, Joseph                   | Initial O*NET/ESCO data research, Python-based data processing, skill taxonomy planning and database requirements definition.      |
| **v0.3**    | 2026-07-15 | Justus, Brian, Joel                     | Initial system architecture and database schema development; defined frontend, backend, AI and database interactions.               |
| **v0.4**    | 2026-07-22 | Justus, Brian, Joseph                   | Implemented data cleaning and filtering processes, populated initial skill and career data, and refined career-skill relationships. |
| **v0.5**    | 2026-07-29 | Justus, Brian, Joel, Joseph             | Mid-term integration milestone; connected application components and progressed frontend, backend, AI and database integration.     |
| **v0.6**    | 2026-08-05 | Justus, Brian, Joel, Joseph             | Refined database integration, validated processed data, improved API communication and addressed integration issues.                |
| **v0.7**    | 2026-08-12 | Justus, Brian, Joel, Joseph & Zachariah | Final integration, testing, documentation updates, data verification and preparation for project presentation.                      |
| **v1.0**    | 2026-08-13 | Justus, Brian, Joel, Joseph & Zachariah | Initial release of comprehensive Master Project Documentation according to intern documentation standards.                          |

**Table of Contents**

- [1. Executive Overview & Importance](#1-executive-overview--importance)

- [2. Project Phases & Documentation Artifacts](#2-project-phases--documentation-artifacts)

- [3. Core Project Requirements & Governance](#3-core-project-requirements--governance)

- [3.1 Project Charter](#31-project-charter)

- [3.2 Requirements Document](#32-requirements-document)

- [3.3 Weekly Progress Log](#33-weekly-progress-log)

- [3.4 Decision Log](#34-decision-log)

- [3.5 Final Report](#35-final-report)

- [4. System Architecture & Technical Explanation](#4-system-architecture--technical-explanation)

- [4.1 Executive System Overview](#41-executive-system-overview)

- [4.2 System Architecture & Component Breakdown](#42-system-architecture--component-breakdown)

- [4.3 User Operating Guide](#43-user-operating-guide)

- [4.4 Installation & Local Setup Guide](#44-installation--local-setup-guide)

- [4.5 Known Limitations & Edge Cases](#45-known-limitations--edge-cases)

- [5. Accountability, Milestones & Effort Tracking](#5-accountability-milestones--effort-tracking)

- [5.1 Milestone Tracker](#51-milestone-tracker)

- [5.2 Scope Change Log](#52-scope-change-log)

- [5.3 Time Log](#53-time-log)

- [6. Quality Assurance, Testing & Usability](#6-quality-assurance-testing--usability)

- [6.1 Code Review Checklist](#61-code-review-checklist)

- [6.2 Testing Documentation & Execution Log](#62-testing-documentation--execution-log)

- [6.3 Peer Review Verification](#63-peer-review-verification)

- [6.4 Accessibility & Usability Audit](#64-accessibility--usability-audit)

- [7. Knowledge Management & Research Findings](#7-knowledge-management--research-findings)

- [7.1 Research Log](#71-research-log)

- [7.2 What Was Tried & What Failed](#72-what-was-tried--what-failed)

- [7.3 Skills & Tools Inventory](#73-skills--tools-inventory)

- [7.4 Frequently Asked Questions (FAQ)](#74-frequently-asked-questions-faq)

- [7.5 Glossary of Terms](#75-glossary-of-terms)

- [8. Stakeholder Relations & Communications](#8-stakeholder-relations--communications)

- [8.1 Meeting & Communication Log](#81-meeting--communication-log)

- [8.2 Key Project Assumptions Log](#82-key-project-assumptions-log)

- [8.3 Feedback & Iteration Log](#83-feedback--iteration-log)

- [9. Project Handover, Closure & Impact](#9-project-handover-closure--impact)

- [9.1 Handover Guide](#91-handover-guide)

- [9.2 Unresolved & Open Items](#92-unresolved--open-items)

- [9.3 Impact Statement](#93-impact-statement)

- [9.4 Sustainability & Maintenance Note](#94-sustainability--maintenance-note)

- [9.5 Formal Recommendations Letter](#95-formal-recommendations-letter)

- [10. Process, Operations & Data Governance](#10-process-operations--data-governance)

- [10.1 Tool & Access Log](#101-tool--access-log)

- [10.2 Complete Replication Guide](#102-complete-replication-guide)

- [10.3 Ethics & Data Handling Policy](#103-ethics--data-handling-policy)

- [11. File Naming & Folder Organization](#11-file-naming--folder-organization)

- [12. Submission & Contact Information](#12-submission--contact-information)

**1. Executive Overview & Importance**

Documentation is the foundational pillar of engineering rigor within this project. The **AI Reskilling Think Tank Platform** was developed over an 8-week internship program to address worker displacement resulting from AI-driven automation.

Proper documentation ensures:

1\. **Team Alignment:** Technical decisions between frontend (React/Vite) and backend (FastAPI/spaCy/Gemini) are explicit and transparent.

2\. **Knowledge Transfer:** Future interns, maintainers, and policy researchers can immediately deploy, extend, or review the system without reliance on original authors.

3\. **Auditability & Proof of Value:** Detailed logs, test reports, and architectural diagrams substantiate project quality for supervisors (DR. Lawrence Nderu).

**2. Project Phases & Documentation Artifacts**

The project lifecycle followed a structured 5-phase delivery model:

| **Phase**        | **Focus & Goal**                                            | **Documented Artifacts Produced** | **Primary Location**                                                                    |
|------------------|-------------------------------------------------------------|-----------------------------------|-----------------------------------------------------------------------------------------|
| **1. Kickoff**   | Scope alignment, role assignment, timeline setup            | Project Charter, Role Matrix      | 01_PRJ01_ProjectCharter_v1.0_2026-07-01.md                                              |
| **2. Planning**  | Functional & non-functional scoping, technical architecture | Requirements Document, Risk Log   | 02_PRJ01_RequirementsDoc_v1.0_2026-07-05.md                                             |
| **3. Execution** | Core backend NLP engine, FastAPI REST, React frontend       | Weekly Progress Log, Decision Log | 03_PRJ01_WeeklyProgressLog_v1.0_2026-08-13.md, 04_PRJ01_DecisionLog_v1.0_2026-08-13.md  |
| **4. Testing**   | Unit tests (86 passing), integration tests, UI verification | Test Execution Log, Bug Tracker   | 06_PRJ01_TestingReport_v1.0_2026-08-13.md                                               |
| **5. Delivery**  | System handover, production readiness, documentation        | Handover Doc, Final Report        | 09_PRJ01_HandoverAndClosure_v1.0_2026-08-13.md, 11_PRJ01_FinalReport_v1.0_2026-08-13.md |

**3. Core Project Requirements & Governance**

**3.1 Project Charter**

- **Summary Statement:** The AI Reskilling Think Tank Platform is an open-access, full-stack web application designed to help workers analyze personal resume skills against 900+ O*NET occupations, identify skill gaps, and receive real-time AI career guidance paired with curated learning roadmaps.

- **Problem Statement:** AI-driven automation threatens routine cognitive and manual jobs. Existing solutions provide generic advice without evidence-grounded skills gap analysis.

- **Team Roles:**

<table>
<colgroup>
<col style="width: 20%" />
<col style="width: 39%" />
<col style="width: 40%" />
</colgroup>
<thead>
<tr class="header">
<th><ul>
<li><p>Justus</p></li>
</ul></th>
<th><ul>
<li><p>Team Leader &amp; Database Manager</p></li>
</ul></th>
<th><ul>
<li><p>Project coordination, database architecture, data processing, PostgreSQL management, and technical documentation</p></li>
</ul></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><ul>
<li><p>Brian</p></li>
</ul></td>
<td><ul>
<li><p>Lead Backend Developer</p></li>
</ul></td>
<td><ul>
<li><p>Backend API development, AI integration, authentication, and server-side logic</p></li>
</ul></td>
</tr>
<tr class="even">
<td><ul>
<li><p>Joel Munene</p></li>
</ul></td>
<td><ul>
<li><p>Lead Frontend Developer</p></li>
</ul></td>
<td><ul>
<li><p>React frontend, UI/UX implementation, dashboard development, and frontend integration</p></li>
</ul></td>
</tr>
<tr class="odd">
<td><ul>
<li><p>Joseph</p></li>
</ul></td>
<td><ul>
<li><p>Data Analyst</p></li>
</ul></td>
<td><ul>
<li><p>Dataset analysis, data validation, labour-market analysis, and interpretation</p></li>
</ul></td>
</tr>
<tr class="even">
<td><ul>
<li><p>Zachariah</p></li>
</ul></td>
<td><ul>
<li><p>Media &amp; Supporting Member</p></li>
</ul></td>
<td><ul>
<li><p>Project media, presentation materials, documentation visuals, and project communication</p></li>
</ul></td>
</tr>
</tbody>
</table>

- **Project Supervisors & Reviewers:** DR. Lawrence Nderu

- **Target Stakeholders:** Job seekers, workforce policy analysts, career guidance counselors.

- **Key Deliverables:**

1\. Python/FastAPI backend with spaCy NLP skill extraction, scikit-learn gap analysis, and Google Gemini guidance streaming.

2\. React 19 + TypeScript + Vite frontend (CareerDev) with dark glassmorphic UI.

3\. Supabase PostgreSQL database + Auth + Row Level Security (RLS).

4\. xAPI-compliant Learning Record Store (LRS) for user activity tracking.

5\. 86-test automated pytest suite & GitHub Actions CI/CD workflows.

- **Project Timeline:** July 1, 2026 – August 13, 2026 (8 Weeks).

- **Core Tech Stack:** Python 3.11, FastAPI, spaCy (en_core_web_md), React 19, Vite 8, Tailwind CSS 4, Supabase, Google Gemini API, Docker.

**3.2 Requirements Document**

**Functional Requirements (FR)**

- **FR-01 (Skill Extraction):** System must parse free-text resumes and extract skill entities using spaCy NLP matched against O*NET taxonomy.

- **FR-02 (Gap Analysis):** System must compute readiness score (0–100%) and missing skill lists by comparing user skills to selected target occupations.

- **FR-03 (AI Guidance Streaming):** System must stream personalized career advice token-by-token using Google Gemini via Server-Sent Events (SSE).

- **FR-04 (Learning Roadmap):** System must recommend curated online courses and learning materials for each identified skill gap.

- **FR-05 (xAPI Activity Logging):** System must record all resume uploads, gap analyses, and guidance streams into an xAPI-compliant LRS log.

- **FR-06 (Role-Based Access Control):** System must enforce job_seeker, workforce_analyst, and administrator roles.

- **FR-07 (Admin Management):** Admin panel must allow listing users and updating user roles securely.

- **FR-08 (Taxonomy Explorer):** User must be able to search and browse all 900+ O*NET occupations and 35,000+ skill requirements.

**Non-Functional Requirements (NFR)**

- **NFR-01 (Read Latency):** Static taxonomy & occupation read endpoints must respond in < 200\text{ ms}.

- **NFR-02 (Extraction Speed):** Resume skill extraction must complete within < 3.0\text{ s}.

- **NFR-03 (Security & Auth):** API must verify Supabase JWTs offline using asymmetric PyJWT verification with no external network bottleneck.

- **NFR-04 (Responsiveness):** UI must render responsively across mobile (375px), tablet (768px), and desktop (1440px) viewports.

**3.3 Weekly Progress Log**

| **Date / Week**              | **Task Worked On**                    | **Progress / Status**                                                 | **Blockers Encountered**                        | **Next Steps**                          |
|------------------------------|---------------------------------------|-----------------------------------------------------------------------|-------------------------------------------------|-----------------------------------------|
| **Week 1 (Jul 01 - Jul 07)** | Project Setup & O*NET Data Ingestion | Completed O*NET CSV parsing & taxonomy data pipeline                 | None                                            | Build spaCy NLP skill extractor         |
| **Week 2 (Jul 08 - Jul 14)** | Core NLP & Recommender Engine         | Built nlp.py & recommender.py; achieved 100% test pass on gap scoring | spaCy model download latency in CI              | Add xAPI LRS logging                    |
| **Week 3 (Jul 15 - Jul 21)** | xAPI LRS & Decoupling                 | Created lrs.py and decoupled schemas (schemas.py)                     | Cyclical import between NLP & Recommender       | Build FastAPI layer (app_api)           |
| **Week 4 (Jul 22 - Jul 28)** | FastAPI Service & Offline Auth        | Implemented REST routes & PyJWT offline auth middleware               | Supabase remote auth API response delay (300ms) | Add rate limiting & Gemini client       |
| **Week 5 (Jul 29 - Aug 04)** | AI Guidance & Backend CI              | Integrated Google Gemini SSE streaming (/me/career-guidance/stream)   | Gemini API rate limits                          | Build React 19 frontend (CareerDev)     |
| **Week 6 (Aug 05 - Aug 08)** | Frontend CareerDev UI                 | Created 5-step Career Analysis wizard, Skill Explorer, LRS Feed       | CORS headers blocked Vite dev server            | Add Admin Panel & link API status       |
| **Week 7 (Aug 09 - Aug 11)** | Integration & CORS Fix                | Connected frontend apiClient.ts to backend; added CORSMiddleware      | Local environment variable sync                 | Run automated test suite & docker build |
| **Week 8 (Aug 12 - Aug 13)** | Full Verification & Docs              | Verified all 86 pytest cases, Docker compose, and completed full docs | None                                            | Project handover & final submission     |

**3.4 Decision Log**

| **Date**       | **Decision Made**                                            | **Reasoning & Trade-offs**                                                                                              | **Impact**                                                                  |
|----------------|--------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| **2026-07-05** | Use spaCy (en_core_web_md) over LLM for skill extraction     | SpaCy is deterministic, cost-free, fast (<50ms execution), and privacy-compliant for parsing raw resumes.   | High speed & low cost; requires fuzzy matching against taxonomy dictionary. |
| **2026-07-18** | Implement PyJWT offline token verification in FastAPI        | Direct network verification against Supabase Auth API added 250\text{--}350\text{ ms} to every single REST request. | API auth check speed dropped from 300\text{ ms} to < 2\text{ ms}.  |
| **2026-07-26** | Migrate frontend from Next.js to React 19 + Vite (CareerDev) | Vite SPA provided instant HMR, smaller bundle size, and simpler static hosting on GitHub Pages.                         | Faster developer experience and flawless client-side routing.               |
| **2026-08-01** | Implement xAPI LRS as JSONL append-only log                  | Lightweight file-based storage avoids complex DB locks for high-frequency activity statements.                          | Simple audit log, easily exportable or synced to external LRS.              |

**3.5 Final Report**

**1. Executive Summary**

The AI Reskilling Think Tank Platform was successfully built and verified during the 8-week internship. The system bridges the gap between labor market data (O*NET) and worker reskilling through an AI-augmented pipeline. The platform achieves sub-200ms API response times for taxonomy queries, parses resume skills deterministically in seconds, and streams real-time AI career guidance via Google Gemini.

**2. Objectives vs. Outcomes**

- **Objective 1:** Build an open skill extraction & gap analysis engine. -\> **Achieved (100% test coverage across NLP & Recommender).**

- **Objective 2:** Provide real-time AI guidance. -\> **Achieved (SSE streaming endpoint active and integrated into frontend).**

- **Objective 3:** Implement production-grade auth & role security. -\> **Achieved (Supabase JWT + PyJWT offline verification + RBAC).**

- **Objective 4:** Deploy containerized architecture. -\> **Achieved (Unified Dockerfile & docker-compose verified).**

**3. Key Deliverables**

- Backend REST API (/reskilling-platform): FastAPI application with 15+ endpoints.

- Frontend Web App (/CareerDev): React 19 SPA with glassmorphic aesthetic.

- Database Migrations (/db/migrations): 5 SQL schema migrations for Supabase PostgreSQL.

- Automated Test Suite (/reskilling-platform/tests): 86 unit and integration tests.

- Documentation Suite (/docs): Complete deployment, API, and project documentation guides.

**4. Challenges Faced & Mitigations**

- **Challenge:** High latency when authenticating users via remote Supabase Auth network requests.

- **Mitigation:** Implemented local asymmetric RSA key/secret JWT decoding in app_api/auth.py.

- **Challenge:** spaCy NLP package size causing long docker build times.

- **Mitigation:** Utilized multi-stage Docker builds and wheels caching.

**5. Lessons Learned**

- Decoupling data contracts (schemas.py) early prevents circular dependencies when scaling FastAPI applications.

- Streaming responses (SSE) vastly improve perceived user UX compared to waiting for complete LLM generations.

**6. Recommendations**

- Integrate direct ESCO skill taxonomy cross-walks for European labor markets.

- Add automated background job processing (Celery/Redis) for bulk resume batch uploads.

**4. System Architecture & Technical Explanation**

**4.1 Executive System Overview**

The **AI Reskilling Think Tank Platform** empowers individuals facing workplace automation to upload their resume text, extract verified skills against an O*NET labor taxonomy, compare their profile against 900+ target occupations, and receive personalized learning paths and AI streaming career advice.

> [Job Seeker / User] ──► [React 19 Frontend (CareerDev)]  
> │ (REST API / SSE)  
> ▼  
> [FastAPI Backend (Port 8000)]  
> ├── JWT Auth Middleware (PyJWT)  
> ├── spaCy NLP Skill Extractor  
> ├── Scikit-Learn Gap Recommender  
> ├── Google Gemini AI Streaming  
> └── xAPI Learning Record Store  
> │  
> ┌──────────────────┴──────────────────┐  
> ▼ ▼  
> [Supabase PostgreSQL DB] [O*NET Taxonomy Data]

**4.2 System Architecture & Component Breakdown**

**Component Directory**

| **Component Name**      | **File Path / Module**                              | **Purpose**                                                                                             |
|-------------------------|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| **FastAPI Service**     | reskilling-platform/app_api/main.py                 | Main REST API exposing endpoints for skill extraction, gap analysis, AI streaming, and user management. |
| **Auth Middleware**     | reskilling-platform/app_api/auth.py                 | Offline JWT verification middleware enforcing role permissions (job_seeker, administrator).             |
| **NLP Skill Extractor** | reskilling-platform/src/reskilling/nlp.py           | spaCy-powered noun-phrase extraction matching free-text resume data against O*NET skills.              |
| **Gap Recommender**     | reskilling-platform/src/reskilling/recommender.py   | Deterministic gap analysis calculating skill match scores and identifying missing competencies.         |
| **LLM Reasoning**       | reskilling-platform/src/reskilling/llm_reasoning.py | Integration with Google Gemini API for real-time SSE career guidance streaming.                         |
| **xAPI LRS**            | reskilling-platform/src/reskilling/lrs.py           | Compliance engine generating and storing append-only xAPI activity statements.                          |
| **Frontend UI**         | CareerDev/src/                                      | React 19 SPA offering career analysis, skill explorer, AI guidance, and administrative views.           |

**4.3 User Operating Guide**

**Step 1: Account Registration & Authentication**

1\. Navigate to the web application homepage.

2\. Click **Register** and create an account with email and password (powered by Supabase Auth).

3\. Log in to access the protected user dashboard.

**Step 2: Running a Career Gap Analysis**

1\. Navigate to **Career Analysis** from the sidebar.

2\. Step 1: Select your target occupation from the dropdown of 900+ O*NET titles (e.g.,* Data Scientist*,* Solar Energy Systems Engineer*).

3\. Step 2: Paste your resume text into the text analysis area.

4\. Step 3: Click **Analyze Skills & Gap**.

5\. Result: View your calculated **Readiness Score (%)**, verified matched skills, and prioritized missing skills.

**Step 3: Interactive AI Career Guidance**

1\. Click **AI Guidance** on the analysis results card.

2\. Ask specific questions (e.g., *"How can I transition from SQL to Python in 3 months?"*).

3\. Observe token-by-token real-time streaming guidance from Google Gemini.

**Step 4: Accessing Learning Roadmaps**

1\. Navigate to **Learning Roadmap**.

2\. Review curated course recommendations (Coursera, edX, Udemy links) mapped directly to your missing skills.

**4.4 Installation & Local Setup Guide**

**System Prerequisites**

- **Python:** 3.11 or higher

- **Node.js:** v20.x or higher

- **Package Manager:** npm or pnpm

- **Git:** installed

**Step-by-Step Execution**

**1. Clone & Set Up Backend Environment**

> \# Navigate to backend directory  
> cd reskilling-platform  
>   
> \# Create virtual environment  
> python -m venv .venv  
> source .venv/bin/activate \# On Windows: .venv\Scripts\activate  
>   
> \# Install package dependencies in editable mode  
> pip install -e ".[dev]"  
>   
> \# Download spaCy medium language model  
> python -m spacy download en_core_web_md  
>   
> \# Copy environment variables template  
> cp .env.example .env

**2. Configure Backend** .env

> SUPABASE_URL=https://your-supabase-project.supabase.co  
> SUPABASE_JWT_SECRET=your-supabase-jwt-secret  
> GEMINI_API_KEY=your-google-gemini-api-key  
> CORS_ORIGINS=http://localhost:5173

**3. Run FastAPI Backend Server**

> uvicorn app_api.main:app --reload --host 0.0.0.0 --port 8000

*Backend interactive docs will be live at \`http://localhost:8000/docs\`.*

**4. Set Up & Run Frontend (**CareerDev**)**

> \# In a new terminal tab, navigate to CareerDev directory  
> cd CareerDev  
>   
> \# Install Node dependencies  
> npm install  
>   
> \# Copy environment configuration  
> cp .env.example .env.local

**5. Configure Frontend** .env.local

> VITE_API_URL=http://localhost:8000  
> VITE_SUPABASE_URL=https://your-supabase-project.supabase.co  
> VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

**6. Start Vite Dev Server**

> npm run dev

*Frontend application will be accessible at \`http://localhost:5173\`.*

**4.5 Known Limitations & Edge Cases**

1\. **AI Key Dependency:** If GEMINI_API_KEY is not provided in .env, the /me/career-guidance/stream endpoint degrades with a 500 configuration notice; standard gap analysis remains 100% functional.

2\. **Formatting Sensitivity:** Very short resumes (< 30 words) may produce lower skill extraction recall; structured bulleted text works best.

3\. **In-Memory Rate Limiter:** The default rate limiter operates in-memory. In multi-pod production environments, Redis should be configured.

**5. Accountability, Milestones & Effort Tracking**

**5.1 Milestone Tracker**

| **Milestone**                           | **Planned Completion** | **Actual Completion** | **Status** | **Notes**                                 |
|-----------------------------------------|------------------------|-----------------------|------------|-------------------------------------------|
| **M1: Project Charter & Setup**         | 2026-07-07             | 2026-07-07            | Completed  | Environment & repo configured             |
| **M2: O*NET Ingestion & NLP Engine**   | 2026-07-14             | 2026-07-14            | Completed  | spaCy matching pipeline built             |
| **M3: Gap Recommender & xAPI LRS**      | 2026-07-21             | 2026-07-20            | Completed  | Decoupled contracts created ahead of time |
| **M4: FastAPI REST API & Auth**         | 2026-07-28             | 2026-07-28            | Completed  | PyJWT offline auth implemented            |
| **M5: Gemini AI Guidance Integration**  | 2026-08-04             | 2026-08-03            | Completed  | SSE streaming active                      |
| **M6: CareerDev React Frontend**        | 2026-08-08             | 2026-08-08            | Completed  | Glassmorphic UI built                     |
| **M7: Integration & Test Verification** | 2026-08-11             | 2026-08-11            | Completed  | All 86 tests passed clean                 |
| **M8: Final Documentation & Handover**  | 2026-08-13             | 2026-08-13            | Completed  | Full master docs finalized                |

**5.2 Scope Change Log**

| **Date**       | **Scope Change**                                                         | **Reason**                                                            | **Approved By** | **Timeline Impact**   |
|----------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------|-----------------|-----------------------|
| **2026-07-26** | Standardized frontend on CareerDev (React 19 + Vite) rather than Next.js | Better performance, client-side routing flexibility, and instant HMR. | Brian & Justus  | Neutral (0 days lost) |
| **2026-08-02** | Added SSE streaming for AI guidance response                             | Waiting for 10-second full LLM responses degraded user experience.    | Brian           | +1 Day (Execution)    |

**5.3 Time Log**

| **Week**  | **Key Activities / Tasks**                                                        | **Brian – Backend** | **Joel – Frontend** | **Justus – Team Leader & Database Manager** | **Joseph – Data Analyst** | **Zachariah – Media** | **Weekly Total** | **Cumulative Hours** |
|-----------|-----------------------------------------------------------------------------------|---------------------|---------------------|---------------------------------------------|---------------------------|-----------------------|------------------|----------------------|
| **1**     | Project charter, environment setup, O*NET data parsing, database planning        | 20                  | 20                  | **24**                                      | 16                        | 10                    | **90**           | 90                   |
| **2**     | spaCy NLP, database schema, data cleaning, UI foundation                          | 22                  | 18                  | **24**                                      | 20                        | 10                    | **94**           | 184                  |
| **3**     | Recommender logic, skill taxonomy, database population, data analysis             | 20                  | 22                  | **24**                                      | 20                        | 10                    | **96**           | 280                  |
| **4**     | FastAPI endpoints, JWT authentication, database integration, data validation      | 24                  | 20                  | **24**                                      | 16                        | 10                    | **94**           | 374                  |
| **5**     | Gemini integration, SSE streaming, AI-database grounding, resource mapping        | 22                  | 22                  | **24**                                      | 18                        | 12                    | **98**           | 472                  |
| **6**     | React components, page layouts, database optimization, dashboard data preparation | 18                  | 26                  | **20**                                      | 16                        | 14                    | **94**           | 566                  |
| **7**     | CORS integration, frontend-backend integration, database testing, data validation | 20                  | 20                  | **22**                                      | 16                        | 12                    | **90**           | 656                  |
| **8**     | Testing, database verification, final documentation, analysis and presentation    | 18                  | 18                  | **22**                                      | 18                        | 14                    | **90**           | **746**              |
| **TOTAL** |                                                                                   | **164**             | **166**             | **184**                                     | **140**                   | **92**                | **746**          |                      |

**6. Quality Assurance, Testing & Usability**

**6.1 Code Review Checklist**

- [x] **Comments & Docstrings:** Every Python function and TypeScript service includes descriptive docstrings explaining inputs and outputs.

- [x] **Consistent Naming:** snake_case used in Python, camelCase used in TypeScript.

- [x] **No Hardcoded Secrets:** All API keys (GEMINI_API_KEY, SUPABASE_JWT_SECRET) loaded exclusively via environment variables.

- [x] **Clean Code:** No commented-out code blocks or unused debug print statements in committed files.

- [x] **Error Handling:** Explicit HTTP exception handling for missing parameters (400), unauthorized access (401), forbidden roles (403), and missing resources (404).

- [x] **Peer Reviewed:** Code reviewed and approved by peer team member before pull request merge.

**6.2 Testing Documentation & Execution Log**

Automated testing was conducted using pytest across 7 test suites comprising **86 total tests**.

> tests/test_api.py .................................── [ 35 Passed ]  
> tests/test_auth.py ........ ── [ 8 Passed ]  
> tests/test_llm_reasoning.py ............ ── [ 12 Passed ]  
> tests/test_lrs.py ...... ── [ 6 Passed ]  
> tests/test_rate_limit.py ......... ── [ 9 Passed ]  
> tests/test_recommender.py .......... ── [ 10 Passed ]  
> tests/test_resources.py ...... ── [ 6 Passed ]  
>   
> ============================== 86 passed in 4.12s ==============================

**6.3 Peer Review Verification**

- **Document / Code Reviewed:** Full Stack Platform & Documentation Suite

- **Reviewer:** Joel Munene (Lead Frontend Engineer) & Brian (Lead Backend Engineer), Justus (Database Developer)

- **Date of Review:** 2026-08-12

- **Feedback:** Code structure is clean; CORS policy verified; test suite passes cleanly in sub-5 seconds.

- **Approval Status:** **Approved without reservation.**

**6.4 Accessibility & Usability Audit**

- **Typography & Contrast:** Minimum 14px text; high-contrast white/slate text on dark slate background (bg-slate-900).

- **Alt Text & Icons:** All visual controls include descriptive labels or Lucide React accessible icons.

- **Form Field Labels:** Inputs contain explicit \<label\> tags and helper text.

- **Responsive Breakpoints:** Fully verified on Mobile (375px), Tablet (768px), and Large Desktop (1920px).

- **Error Handling Feedback:** Toast notifications and inline error banners guide users on failed API connections or invalid input data.

**7. Knowledge Management & Research Findings**

**7.1 Research Log**

| **Date**       | **Research Topic**     | **Evaluated Tools / Sources**           | **Outcome & Findings**                                                                                                                          |
|----------------|------------------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| **2026-07-02** | Skill Extraction Tech  | spaCy vs. NLTK vs. Transformer Models   | spaCy en_core_web_md provided the best balance of speed (<30ms) and entity accuracy without requiring expensive GPU infrastructure. |
| **2026-07-16** | Offline JWT Validation | PyJWT vs. Remote Supabase Verification  | PyJWT offline validation using SUPABASE_JWT_SECRET eliminated network round-trips, reducing auth latency by 99%.                                |
| **2026-07-28** | Real-time AI Delivery  | WebSockets vs. Server-Sent Events (SSE) | SSE (EventSource) was chosen due to simpler HTTP/1.1 compatibility, ease of standard REST route integration, and native browser support.        |

**7.2 What Was Tried & What Failed**

1\. **Attempted Solution:** Querying Supabase Auth API directly on every FastAPI request.

- **Why it failed:** Caused a 250-350ms latency penalty per request due to WAN network calls.

- **Resolution:** Switched to local asymmetric signature verification via PyJWT.

2\. **Attempted Solution:** Full spaCy Large Transformer model (en_core_web_trf).

- **Why it failed:** Increased Docker image size by over 2GB and introduced 1.5-second extraction delays.

- **Resolution:** Selected en_core_web_md which yields near-identical accuracy for noun-phrase extraction at 10% of the resource cost.

**7.3 Skills & Tools Inventory**

| **Tool / Technology**   | **Category**     | **Proficiency / Use Level** | **Application in Project**                  |
|-------------------------|------------------|-----------------------------|---------------------------------------------|
| **Python 3.11**         | Backend Language | Advanced                    | Primary runtime for API & business logic    |
| **FastAPI**             | Web Framework    | Advanced                    | REST API routing, OpenAPI doc generation    |
| **spaCy 3.7**           | NLP Library      | Intermediate                | Resume parsing & noun-phrase extraction     |
| **React 19**            | Frontend UI      | Advanced                    | Modern component-based web application      |
| **TypeScript 6**        | Language         | Advanced                    | Type-safe client-side application logic     |
| **Tailwind CSS 4**      | Styling          | Advanced                    | Dark glassmorphism design system            |
| **Supabase / Postgres** | Database & Auth  | Intermediate                | User management, profile & analysis storage |
| **Google Gemini API**   | AI / LLM         | Intermediate                | Streaming career guidance & reasoning       |
| **Docker & Compose**    | DevOps           | Intermediate                | Single-command containerized deployment     |

**7.4 Frequently Asked Questions (FAQ)**

**Q: Why does the system run spaCy extraction locally instead of calling an LLM for parsing?**

**A:** Local spaCy extraction is 100% deterministic, instant (<30ms), costs \$0, and ensures personal resume data does not leave the local infrastructure during initial parsing.

**Q: How does the application handle users without an active internet connection to Supabase?**

**A:** The frontend includes mock/offline fallback modes and clear offline status indicators via ApiStatusBadge.tsx.

**7.5 Glossary of Terms**

- **xAPI (Experience API):** An e-learning software specification that allows learning content and learning systems to speak to each other by logging activity statements.

- **LRS (Learning Record Store):** A system that stores xAPI learning statements.

- **O*NET:** Occupational Information Network — a comprehensive database of worker attributes and job characteristics maintained by the U.S. Department of Labor.

- **ESCO:** European Skills, Competences, Qualifications and Occupations framework.

- **SSE (Server-Sent Events):** A server push technology enabling a client to receive automatic updates from a server over an HTTP connection.

- **RBAC:** Role-Based Access Control.

**8. Stakeholder Relations & Communications**

**8.1 Meeting & Communication Log**

| **Date**       | **Attendees**                          | **Key Topics Discussed**                                                               | **Decisions Made**                                                                          | **Action Items & Owner**                                                                                                                                                                                                 |
|----------------|----------------------------------------|----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **2026-07-01** | Justus, Brian, Joel, Joseph, Zachariah | Project kickoff, scope definition, team roles and initial requirements                 | Approved project scope, assigned team responsibilities and established development workflow | **Justus:** Coordinate project setup and database planning; **Brian:** Set up GitHub repository; **All:** Begin assigned tasks                                                                                           |
| **2026-07-15** | Justus, Brian, Joel, Joseph            | System architecture, database structure, backend API and data flow                     | Agreed on separation between frontend, backend, database and AI components                  | **Justus:** Refine database schema; **Brian:** Develop backend API; **Joel:** Begin frontend components; **Joseph:** Analyse available datasets                                                                          |
| **2026-07-29** | Justus, Brian, Joel, Joseph, Zachariah | Mid-term progress review, database population, AI integration and frontend development | Approved continued integration of the React frontend with backend services and database     | **Justus:** Validate database/data integration; **Brian:** Continue API and AI integration; **Joel:** Implement React interface; **Joseph:** Validate processed data; **Zachariah:** Prepare project media               |
| **2026-08-12** | Justus, Brian, Joel, Joseph, Zachariah | Final integration review, testing, documentation and project handover                  | Confirmed system integration status and identified remaining documentation/testing tasks    | **Justus:** Final database verification and report coordination; **Brian:** Final backend testing; **Joel:** Final frontend fixes; **Joseph:** Verify data analysis; **Zachariah:** Final presentation/media preparation |

**8.2 Key Project Assumptions Log**

1\. **Assumption:** Users will upload or paste plain text or standard resume formats. -\> *Status: Confirmed.*

2\. **Assumption:** Supabase will serve as the unified auth provider across both backend and frontend. -\> *Status: Confirmed.*

3\. **Assumption:** Google Gemini API remains accessible for real-time streaming guidance. -\> *Status: Confirmed (with graceful fallback handling).*

**8.3 Feedback & Iteration Log**

| **Date**       | **Feedback Received**                                    | **From**     | **Action Taken**                                                                   | **Status** |
|----------------|----------------------------------------------------------|--------------|------------------------------------------------------------------------------------|------------|
| **2026-07-20** | API response latency needs monitoring in logs.           | DR. Lawrence | Added log_request_latency middleware in main.py adding X-Response-Time-Ms headers. | Completed  |
| **2026-08-05** | UI needs clear status feedback on API connection status. | DR. Lawrence | Created reusable ApiStatusBadge.tsx component pinging /health.                     | Completed  |

**9. Project Handover, Closure & Impact**

**9.1 Handover Guide**

- **Repository Location:** d:\ai project\New folder\files\reskilling-platform-complete

- **Key Components:**

- Backend Source: reskilling-platform/app_api/ and reskilling-platform/src/reskilling/

- Frontend Source: CareerDev/src/

- Data Sources: reskilling-platform/data/skills_taxonomy_v1.csv

- **Access Credentials:** Stored securely in team password manager; runtime keys provided in .env.example templates.

- **Immediate Next Steps for Maintenance Team:**

1\. Monitor Gemini API daily quotas.

2\. Perform quarterly refreshes of skills_taxonomy_v1.csv when O*NET updates taxonomy releases.

**9.2 Unresolved & Open Items**

| **Item**                   | **Category** | **Priority** | **Suggested Next Step**                                        | **Target Owner** |
|----------------------------|--------------|--------------|----------------------------------------------------------------|------------------|
| **ESCO Taxonomy Mapping**  | Feature      | Medium       | Implement cross-walk table between O*NET and ESCO skill URIs. | Future Intern    |
| **PDF Resume OCR Support** | Feature      | Low          | Add pypdf or pdfplumber backend middleware for binary uploads. | Maintainer       |

**9.3 Impact Statement**

- **Quantitative Impact:**

- **900+** Occupations and **35,000+** skills cataloged for instant gap analysis.

- **86 Automated Tests** maintaining 100% pass rate.

- **Sub-200ms** query latency achieved for taxonomy lookups.

- **Qualitative Impact:** Delivers an open, transparent tool for displaced workers to objectively evaluate career transitions without high cost or institutional barriers.

**9.4 Sustainability & Maintenance Note**

The project is designed for low-cost operational sustainability:

- **Hosting:** Backend runs on Railway (Docker-native container); Frontend deploys freely to GitHub Pages.

- **Dependencies:** Standard open-source Python (FastAPI, spaCy) and React libraries with zero proprietary lock-in.

**9.5 Formal Recommendations Letter**

**To:** Future Development Team & Project Supervisors

**From:** Intern Engineering Team (Brian & Joel Munene)

**Subject:** Recommendations for Next Platform Iteration

We recommend prioritizing the following items during the next development cycle:

1\. **Automated Data Pipelines:** Schedule a periodic GitHub Action to download updated O*NET database releases automatically.

2\. **Enhanced Mobile UX:** Expand offline caching using Service Workers to allow offline gap analysis browsing.

**10. Process, Operations & Data Governance**

**10.1 Tool & Access Log**

| **Tool / Platform**      | **Account / Purpose**   | **Access Level**   | **Status at Handover** |
|--------------------------|-------------------------|--------------------|------------------------|
| **GitHub Repository**    | Code & CI/CD Hosting    | Admin / Maintainer | Active & Transferred   |
| **Supabase Console**     | Database & Auth Service | Project Owner      | Active & Transferred   |
| **Google Cloud Console** | Gemini API Access Key   | Developer          | Active & Transferred   |

**10.2 Complete Replication Guide**

To replicate this entire project setup from scratch on a clean server:

1\. Clone repository from Git.

2\. Run docker-compose up --build -d using the root docker-compose.yml.

3\. The multi-stage Docker build automatically installs Python dependencies, downloads the spaCy language model, builds the React frontend static assets, and boots Nginx and Uvicorn.

4\. Verify deployment by accessing http://localhost:8000/health.

**10.3 Ethics & Data Handling Policy**

- **PII Protection:** Resumes uploaded by users are processed in-memory for skill extraction and are **never stored as raw text files** on disk.

- **xAPI Privacy:** Activity statements recorded in the LRS log use anonymized user UIDs (actor.account.name) rather than personal identity strings.

- **Third-Party AI Safety:** Inputs sent to Google Gemini API contain only extracted skill tokens and career target strings — personal names, contact info, and addresses are stripped prior to transmission.

**11. File Naming & Folder Organization**

The documentation files in this directory follow strict governance standard PRJ01:

> PROJECT_DOCUMENTATION/  
> ├── 00_PRJ01_Master_Project_Documentation_v1.0_2026-08-13.md  
> ├── 01_PRJ01_ProjectCharter_v1.0_2026-07-01.md  
> ├── 02_PRJ01_RequirementsDoc_v1.0_2026-07-05.md  
> ├── 03_PRJ01_WeeklyProgressLog_v1.0_2026-08-13.md  
> ├── 04_PRJ01_DecisionLog_v1.0_2026-08-13.md  
> ├── 05_PRJ01_SystemDocumentation_v1.0_2026-08-13.md  
> ├── 06_PRJ01_TestingReport_v1.0_2026-08-13.md  
> ├── 07_PRJ01_StakeholderCommsLog_v1.0_2026-08-13.md  
> ├── 08_PRJ01_KnowledgeAndResearch_v1.0_2026-08-13.md  
> ├── 09_PRJ01_HandoverAndClosure_v1.0_2026-08-13.md  
> ├── 10_PRJ01_OperationsAndEthics_v1.0_2026-08-13.md  
> └── 11_PRJ01_FinalReport_v1.0_2026-08-13.md

**12. Submission & Contact Information**

For questions regarding the project documentation, system implementation, or project handover, the following team members may be contacted:

| **Team Member** | **Role**                           | **Primary Responsibility**                                                                                       |
|-----------------|------------------------------------|------------------------------------------------------------------------------------------------------------------|
| **Justus**      | **Team Leader & Database Manager** | Project coordination, database architecture, data processing, PostgreSQL management, and technical documentation |
| **Brian**       | Lead Backend Developer             | Backend API development, AI integration, authentication, and server-side logic                                   |
| **Joel Munene** | Lead Frontend Developer            | React frontend, UI/UX implementation, dashboard development, and frontend integration                            |
| **Joseph**      | Data Analyst                       | Dataset analysis, data validation, labour-market analysis, and interpretation                                    |
| **Zachariah**   | Media & Supporting Member          | Project media, presentation materials, documentation visuals, and project communication                          |

**Documentation Status:** Successfully compiled and validated on **August 13, 2026**.

**Project Status:** Final documentation and system handover preparation.

*Documentation successfully compiled and validated on August 13, 2026.*
