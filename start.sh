#!/bin/bash

# ReachInbox Email Scheduler - 1-Click Startup Script

echo "========================================================"
echo "🚀 Starting ReachInbox Email Job Scheduler & Dashboard"
echo "========================================================"

# 1. Check and automatically start Docker Desktop on macOS if stopped
if ! docker info >/dev/null 2>&1; then
    echo "⚡ Docker is not running. Automatically starting Docker Desktop..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker
        echo "⏳ Waiting for Docker daemon to initialize..."
        until docker info >/dev/null 2>&1; do
            sleep 2
        done
        echo "✅ Docker daemon is ready!"
    fi
fi

# 2. Start PostgreSQL, Redis, Elasticsearch in background
echo "📦 Starting Docker services (PostgreSQL, Redis, Elasticsearch)..."
docker compose up -d

# 3. Ensure database schema is synced
echo "🔄 Checking database schema..."
(cd backend && npx prisma db push --skip-generate >/dev/null 2>&1)

# 4. Start Backend and Frontend
echo "✨ Launching Backend API (Port 4000) & Frontend UI (Port 3000)..."

(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && (npm run start 2>/dev/null || npm run dev)) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "========================================================"
echo "🎉 ReachInbox Application is Live!"
echo "🖥️  Frontend Dashboard: http://localhost:3000"
echo "📡 Backend API:        http://localhost:4000"
echo "📊 BullBoard Queue UI: http://localhost:3000/admin/queues"
echo "========================================================"

wait
