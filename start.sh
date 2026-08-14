#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/reskilling-platform"
FRONTEND_DIR="$ROOT_DIR/CareerDev"

echo "Starting backend and frontend..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "Backend .env not found. Copy reskilling-platform/.env.example to reskilling-platform/.env and configure it first."
  exit 1
fi

( cd "$BACKEND_DIR" && uvicorn app_api.main:app --reload --host 0.0.0.0 --port 8000 ) &
BACKEND_PID=$!

( cd "$FRONTEND_DIR" && npm run dev -- --host 0.0.0.0 --port 5173 ) &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait "$BACKEND_PID" "$FRONTEND_PID"
