# PRJ01: Knowledge Management, Research & Glossary

## 1. Research Log

| Date | Topic Researched | Tools Evaluated | Finding / Outcome |
| :--- | :--- | :--- | :--- |
| **2026-07-02** | Skill Extraction Tech | spaCy vs. NLTK vs. LLMs | Selected spaCy `en_core_web_md` for deterministic parsing and sub-50ms execution speed. |
| **2026-07-16** | Auth Token Verification | PyJWT vs. Remote API Calls | PyJWT offline validation reduced auth latency from 300ms to < 2ms. |
| **2026-07-28** | Real-Time AI Delivery | WebSockets vs. SSE | Server-Sent Events (SSE) provided optimal streaming performance over standard HTTP. |

## 2. What I Tried & What Failed

* **Failed Approach:** Remote API authentication checks against Supabase per request.  
  * *Reason:* WAN network latency added 300ms overhead.  
  * *Learned:* Asymmetric JWT local verification is critical for high-performance microservices.
* **Failed Approach:** Heavy spaCy Transformer Model (`en_core_web_trf`).  
  * *Reason:* Excessively large Docker footprint (+2GB) and high RAM consumption.  
  * *Learned:* `en_core_web_md` provides identical skill noun-phrase extraction accuracy at a fraction of the footprint.

## 3. Glossary of Terms

| Term / Acronym | Definition |
| :--- | :--- |
| **API** | Application Programming Interface — REST communication protocol between client and server. |
| **xAPI** | Experience API — International e-learning specification for tracking learning activities. |
| **LRS** | Learning Record Store — System that stores xAPI activity statements. |
| **O*NET** | Occupational Information Network — Database of occupations and skill requirements by US Dept of Labor. |
| **SSE** | Server-Sent Events — HTTP streaming standard for server-to-client updates. |
| **JWT** | JSON Web Token — Encrypted security token used for stateless authentication. |
