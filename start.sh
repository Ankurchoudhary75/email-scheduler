#!/bin/bash

# ReachInbox Email Scheduler - 1-Click Zero-Docker Autonomous Startup Script

echo "========================================================"
echo "🚀 Starting ReachInbox Email Job Scheduler & Dashboard"
echo "========================================================"

# 1. Try launching Docker Desktop if on macOS and available
if ! docker info >/dev/null 2>&1; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "⚡ Docker is not running. Attempting to launch Docker Desktop in background..."
        open -a Docker 2>/dev/null || true
    fi
fi

# 2. Try starting Docker services if Docker daemon is available
if docker info >/dev/null 2>&1; then
    echo "📦 Starting Docker containers (PostgreSQL, Redis, Elasticsearch)..."
    docker compose up -d 2>/dev/null || true
else
    echo "💡 Note: Docker is offline. Running in Autonomous Zero-Docker Mode (Embedded Storage + Embedded Queue Engine)."
fi

# 3. Try database schema push if PostgreSQL is available
(cd backend && npx prisma db push --skip-generate >/dev/null 2>&1) &

# 4. Start Backend (Port 4000) and Frontend (Port 3000)
echo "✨ Starting Backend API (Port 4000) & Frontend UI (Port 3000)..."

(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "========================================================"
echo "🎉 ReachInbox Application is Live!"
echo "🖥️  Frontend Dashboard: http://localhost:3000"
echo "📡 Backend API:        http://localhost:4000"
echo "📊 BullBoard Queue UI: http://localhost:3000/admin/queues"
echo "========================================================"

wait
