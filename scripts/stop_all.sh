#!/usr/bin/env bash
# Stop the three services and the tunnel.
pkill -f "uvicorn main:app" 2>/dev/null && echo "ai-service stopped"
pkill -f "node server.js" 2>/dev/null && echo "backend stopped"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "frontend stopped"   # next-server ignores TERM sometimes and doesn't match a "next start" pattern
pkill -f "ngrok http" 2>/dev/null && echo "tunnel stopped"
exit 0
