# PRJ01: Process, Operations & Ethics Policy

## 1. Tool & Access Log

| Tool / Platform | Account / Purpose | Access Level | Status at Close |
| :--- | :--- | :--- | :--- |
| **GitHub Repo** | Code & CI/CD Pipelines | Admin | Active & Transferred |
| **Supabase** | DB & Auth Infrastructure | Owner | Active & Transferred |
| **Google Cloud** | Gemini API Service Key | Developer | Active & Transferred |

## 2. Replication Guide
To build this project from scratch:
1. Clone the repository.
2. Run `docker-compose up --build` at the repository root.
3. The multi-stage build will compile both backend and frontend, boot Uvicorn and Nginx, and launch the platform on `http://localhost:8000` and `http://localhost:5173`.

## 3. Ethics & Data Handling Standard

* **Data Privacy:** Resume text uploaded to the system is processed in volatile RAM only for spaCy NLP extraction and is **never written to disk or stored as plain text**.
* **Anonymized xAPI Statements:** Activity logs record user UIDs, event verbs (e.g., `uploaded`, `analyzed`), and timestamps without personal identifiable information (PII).
* **AI Guardrails:** Text sent to Google Gemini is filtered to include only skill keywords and career targets. No personal contact details, names, or addresses are transmitted to third-party LLM providers.
