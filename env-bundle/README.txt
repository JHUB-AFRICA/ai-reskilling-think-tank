# Environment Variables Bundle
# AI Reskilling Think Tank Platform
# Generated: 2026-08-10 11:10:30

## Files Included

| File             | Purpose                                        |
|------------------|------------------------------------------------|
| root.env.example | Root-level template for docker-compose         |
| backend.env      | Backend (FastAPI) environment variables         |
| frontend.env     | Frontend (React/Vite) environment variables     |

## Docker Image References
- Backend image tag (local/CI): ai-reskilling-backend:test
- Backend deployed on:         Railway ? https://ai-reskilling-api.up.railway.app
- Frontend deployed on:        GitHub Pages ? https://munenejoel388.github.io/CareerDev/

## Usage
1. Copy backend.env  ? reskilling-platform/.env
2. Copy frontend.env ? CareerDev/.env
3. Run: docker compose up --build
