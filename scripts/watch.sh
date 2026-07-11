#!/usr/bin/env bash
# Live activity monitor — run this in a spare terminal to watch someone use the app.
# Tip: ngrok's own inspector at http://localhost:4040 shows every visitor request too.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/logs/backend.log"

if [ ! -f "$LOG" ]; then
  echo "No backend log yet at $LOG — start the app first (scripts/start_all.sh)."
  exit 1
fi

BOLD=$(tput bold 2>/dev/null); DIM=$(tput dim 2>/dev/null)
GREEN=$(tput setaf 2 2>/dev/null); CYAN=$(tput setaf 6 2>/dev/null)
YELLOW=$(tput setaf 3 2>/dev/null); RED=$(tput setaf 1 2>/dev/null)
RESET=$(tput sgr0 2>/dev/null)

echo "${BOLD}Watching application activity${RESET} (Ctrl+C to stop)"
echo "${DIM}ngrok live inspector with visitor IPs: http://localhost:4040${RESET}"
echo "---"

tail -n 0 -F "$LOG" | while IFS= read -r line; do
  ts=$(date +%H:%M:%S)
  case "$line" in
    "[question] "*)             echo "${BOLD}${GREEN}$ts  ❓ asked:${RESET} ${line#\[question\] }" ;;
    *"POST /api/query 200"*)    echo "${CYAN}$ts  ✅ answered${RESET}  ${DIM}${line##*query }${RESET}" ;;
    *"POST /api/query"*)        echo "${RED}$ts  ⚠️  query failed  $line${RESET}" ;;
    *"GET /api/conversations/"*) echo "$ts  📜 opened a past conversation" ;;
    *"GET /api/conversations"*)  : ;;  # sidebar list refresh — noise
    *"GET /api/tables/"*)       echo "${YELLOW}$ts  📊 browsing data: ${line#*tables/}${RESET}" ;;
    *"GET /api/tables"*)        echo "${YELLOW}$ts  📊 opened the data explorer${RESET}" ;;
    *"DELETE /api/conversations"*) echo "$ts  🗑  deleted a conversation" ;;
    *"GET /api/health"*)        : ;;
    *"listening on port"*)      echo "${DIM}$ts  backend started${RESET}" ;;
  esac
done
