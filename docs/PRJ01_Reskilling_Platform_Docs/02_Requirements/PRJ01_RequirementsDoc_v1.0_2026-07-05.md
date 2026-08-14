# PRJ01: Requirements Document

| Field | Details |
| :--- | :--- |
| **Document Code** | `PRJ01_RequirementsDoc_v1.0_2026-07-05` |
| **Project Name** | AI Reskilling Think Tank Platform |
| **Date Created** | 2026-07-05 |
| **Version** | v1.0 |

---

## 1. Functional Requirements (FR)

### FR-01: Skill Extraction Engine
* The system shall accept free-text resumes and extract skill entities using spaCy NLP matched against the O*NET taxonomy dictionary.

### FR-02: Deterministic Gap Analysis
* The system shall compare extracted user skills against any selected O*NET occupation requirements and compute a Readiness Score (0-100%) and a prioritized list of missing skills.

### FR-03: AI Career Guidance Streaming
* The system shall stream real-time career transition guidance token-by-token via Server-Sent Events (SSE) powered by Google Gemini API.

### FR-04: Learning Resource Recommendation
* The system shall provide curated online courses and learning resources corresponding to each identified missing skill.

### FR-05: xAPI Activity Logging
* The system shall automatically record user actions (resume upload, gap analysis, guidance streaming) into an xAPI-compliant Learning Record Store (LRS).

### FR-06: Authentication & Role-Based Access Control (RBAC)
* The system shall authenticate users via Supabase JWT tokens and enforce role permissions (`job_seeker`, `workforce_analyst`, `administrator`).

### FR-07: Admin Panel
* The system shall provide an administrative interface allowing admins to list registered users and update user roles.

---

## 2. Non-Functional Requirements (NFR)

### NFR-01: Performance & Latency
* Read queries (occupations list, taxonomy stats) must respond in $< 200\text{ ms}$.
* Resume skill extraction must complete in $< 3.0\text{ seconds}$.

### NFR-02: Security & Privacy
* Passwords and raw resume files shall never be stored in plain text.
* API authentication tokens must be verified offline via asymmetric PyJWT verification.

### NFR-03: Responsive Design
* The user interface must adapt responsively across mobile (375px), tablet (768px), and desktop (1440px) viewports.
