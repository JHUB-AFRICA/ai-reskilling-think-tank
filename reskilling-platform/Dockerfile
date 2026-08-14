# ============================================================
# Backend Dockerfile — AI Reskilling Platform (FastAPI)
# ============================================================
# Single-stage build for simplicity and reliability.
# The spaCy model is downloaded AFTER spaCy is installed.
#
# Build: docker build -t ai-reskilling-backend .
# Run:   docker run -p 8000:8000 --env-file .env ai-reskilling-backend
# ============================================================

FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies (gcc needed for psycopg2, numpy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip first
RUN pip install --upgrade pip

# ── Step 1: Install all Python dependencies ─────────────────
# Copy pyproject.toml first so this layer is cached unless deps change
COPY pyproject.toml .

RUN pip install \
    "fastapi>=0.111" \
    "uvicorn[standard]>=0.30" \
    "spacy>=3.7" \
    "pandas>=2.2" \
    "scikit-learn>=1.4" \
    "python-dotenv>=1.0" \
    "requests>=2.31" \
    "sqlalchemy>=2.0" \
    "psycopg2-binary>=2.9" \
    "pyjwt>=2.9" \
    "google-genai>=0.3"

# ── Step 2: Download spaCy NLP model ────────────────────────
# Must come AFTER spaCy is installed above
RUN python -m spacy download en_core_web_md

# ── Step 3: Copy source code and install the package ────────
COPY . .

# Install the local package (app_api + reskilling) without re-installing deps
RUN pip install --no-deps -e .

# ── Step 4: Security — run as non-root user ─────────────────
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

# Expose API port
EXPOSE 8000

# Health check — generous start period for spaCy model load on first request
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Start the API
CMD ["uvicorn", "app_api.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--log-level", "info"]
