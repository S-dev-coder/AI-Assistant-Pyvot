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

echo "starting ngrok tunnel..."
(nohup ngrok http 3000 --domain=throttle-unsecured-oversweet.ngrok-free.dev --log stdout > "$ROOT/logs/tunnel.log" 2>&1 &)
sleep 5
curl -s localhost:4040/api/tunnels | python3 -c "import json,sys; ts=json.load(sys.stdin)['tunnels']; print(ts[0]['public_url'] if ts else 'tunnel URL not ready — curl localhost:4040/api/tunnels in a few seconds')"
