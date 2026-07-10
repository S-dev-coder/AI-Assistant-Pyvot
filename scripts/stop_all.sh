#!/usr/bin/env bash
# Stop the three services and the tunnel.
pkill -f "uvicorn main:app" 2>/dev/null && echo "ai-service stopped"
pkill -f "node server.js" 2>/dev/null && echo "backend stopped"
pkill -f "next start" 2>/dev/null && echo "frontend stopped"
pkill -f "cloudflared tunnel" 2>/dev/null && echo "tunnel stopped"
exit 0
