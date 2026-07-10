#!/usr/bin/env bash
# Start all three services + the public tunnel. Logs land in ./logs/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/logs"

pg_isready -q || { echo "PostgreSQL is not running (brew services start postgresql@18)"; exit 1; }

echo "starting AI service (:8000)..."
(cd "$ROOT/ai-service" && nohup ./.venv/bin/uvicorn main:app --port 8000 > "$ROOT/logs/ai-service.log" 2>&1 &)

echo "starting backend (:5050)..."
(cd "$ROOT/backend" && nohup node server.js > "$ROOT/logs/backend.log" 2>&1 &)

echo "starting frontend (:3000)..."
(cd "$ROOT/frontend" && nohup npm start > "$ROOT/logs/frontend.log" 2>&1 &)

sleep 5
curl -sf localhost:5050/api/health >/dev/null && echo "backend + AI service: up" || echo "WARN: backend health failed — check logs/"

echo "starting cloudflared tunnel..."
(nohup cloudflared tunnel --url http://localhost:3000 > "$ROOT/logs/tunnel.log" 2>&1 &)
sleep 8
grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" "$ROOT/logs/tunnel.log" | head -1 || echo "tunnel URL not ready yet — grep logs/tunnel.log in a few seconds"
