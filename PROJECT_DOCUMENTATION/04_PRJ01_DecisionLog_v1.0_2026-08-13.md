# PRJ01: Decision Log

| Date | Decision Made | Reasoning & Trade-offs | Impact |
| :--- | :--- | :--- | :--- |
| **2026-07-05** | Use spaCy (`en_core_web_md`) over LLM for skill extraction | SpaCy is deterministic, cost-free, fast ($<50\text{ms}$ execution), and privacy-compliant for parsing raw resumes. | High speed & low cost; requires fuzzy matching against taxonomy dictionary. |
| **2026-07-18** | Implement PyJWT offline token verification in FastAPI | Direct network verification against Supabase Auth API added $250\text{--}350\text{ ms}$ to every single REST request. | API auth check speed dropped from $300\text{ ms}$ to $< 2\text{ ms}$. |
| **2026-07-26** | Migrate frontend from Next.js to React 19 + Vite (`CareerDev`) | Vite SPA provided instant HMR, smaller bundle size, and simpler static hosting on GitHub Pages. | Faster developer experience and flawless client-side routing. |
| **2026-08-01** | Implement xAPI LRS as JSONL append-only log | Lightweight file-based storage avoids complex DB locks for high-frequency activity statements. | Simple audit log, easily exportable or synced to external LRS. |
