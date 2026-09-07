# 🚀 ReachInbox Full-stack Email Job Scheduler & Dashboard

> 🌐 **Live Public Links (Active High-Speed Cloudflare Tunnels)**:
> - **Frontend Dashboard**: [https://urw-hint-laura-org.trycloudflare.com](https://urw-hint-laura-org.trycloudflare.com)
> - **Backend API Service**: [https://blake-posing-stickers-couples.trycloudflare.com](https://blake-posing-stickers-couples.trycloudflare.com)
> - **Live BullMQ Queue UI**: [https://urw-hint-laura-org.trycloudflare.com/admin/queues](https://urw-hint-laura-org.trycloudflare.com/admin/queues)

A production-grade, high-throughput **Email Scheduler Service and Frontend Dashboard** built for ReachInbox hiring assignment requirements.

Powered by **Node.js/Express (TypeScript)**, **BullMQ + Redis**, **PostgreSQL (Prisma ORM)**, **Elasticsearch**, **Ethereal Fake SMTP**, **Slack OAuth / Live Webhooks**, and a modern **Next.js 14 + Tailwind CSS** frontend.

---

## 🌟 Key Features

### Backend Architecture
- ⚡ **BullMQ + Redis Queue Engine (No Cron)**: Persistent delayed job scheduler managing scheduled emails without operating-system or library cron jobs.
- 💾 **Server Restart Persistence**: Delayed queue jobs persist in Redis ZSET structures while job metadata resides in PostgreSQL. Server restarts preserve send timelines with zero job duplication or loss (`jobId = emailRecord.id` idempotency).
- ⚙️ **Configurable Worker Concurrency**: Support parallel email processing with configurable concurrency (`WORKER_CONCURRENCY`, default `5`).
- ⏱️ **Provider Throttling (Min Delay)**: Minimum delay between individual email sends (default `2 seconds`) to mimic email provider throttling.
- 🛡️ **Hourly Rate Limiting & Auto-Rescheduling**:
  - Redis atomic window counters (`ratelimit:sender:{senderId}:{YYYY-MM-DD-HH}`).
  - When hourly limit is hit for a sender, remaining jobs are automatically **delayed/rescheduled to the next hour window** without failing or dropping jobs.
- 🔔 **Live Slack Rate Limit Alerts**:
  - Interactive "Connect Slack" OAuth 2.0 flow & Incoming Webhook integration.
  - Posts live Slack Block Kit notification alerts the instant a sender hits their hourly limit.
- 🔍 **Elasticsearch Indexing & Full-text Search**: Auto-indexes all email jobs (`emails` index). Exposed search API enables sub-millisecond search across recipients, subjects, bodies, and senders.
- 📊 **BullBoard Live Queue UI**: Real-time BullMQ queue dashboard exposed at `http://localhost:4000/admin/queues`.

### Frontend Dashboard
- 🔐 **Google OAuth Login**: Header showing Google user details (Avatar, Name, Email) and logout.
- 📊 **Analytics Stat Cards**: Overview cards for Scheduled Jobs, Sent Emails, Rate-Limited Jobs, Failed Jobs, and BullMQ Redis state indicators.
- 📧 **Compose Campaign Modal**:
  - Subject and Body inputs.
  - **CSV / TXT Lead Uploader**: Auto-parses files and displays valid email count with live preview.
  - Schedule parameters: Start time selector, Delay between sends, Hourly rate limit.
- 📋 **Scheduled & Sent Tables**:
  - Real-time status badges (`SCHEDULED`, `RATE_LIMITED`, `SENT`, `FAILED`).
  - **Ethereal Preview Link**: Clickable link to view actual fake SMTP HTML email in Ethereal Sandbox.
  - Delete / Cancel scheduled job action.
- 🔎 **Elasticsearch Search Bar**: Instant debounced query matching subject, body, or recipient.
- 💬 **Slack Integration Modal**: Connect Slack incoming webhooks or OAuth with instant test verification.

---

## 🏗️ Architecture & Component Flow

```
+-----------------------------------------------------------------------+
|                             Next.js Frontend                          |
|  (Google OAuth, Compose Modal, CSV Lead Parser, Analytics, Dashboards)|
+-----------------------------------------------------------------------+
                                   | HTTP API
                                   v
+-----------------------------------------------------------------------+
|                         Express.js Backend API                        |
|  - Auth Middleware (Google OAuth verification)                        |
|  - Email Scheduler API (/api/emails/schedule)                         |
|  - Elasticsearch Search API (/api/emails/search)                      |
|  - Slack OAuth & Webhook Handler (/api/slack/*)                       |
|  - BullBoard UI (/admin/queues)                                       |
+-----------------------------------------------------------------------+
         |                       |                        |
         v DB Sync               v Add Delayed Job        v Indexing
+------------------+    +------------------+    +------------------+
| PostgreSQL (DB)  |    |  Redis + BullMQ  |    |  Elasticsearch   |
| (Emails, Senders,|    |  Delayed Queue   |    | (Indexed Emails  |
|  Slack Tokens)   |    +------------------+    |  Search Engine)  |
+------------------+             |              +------------------+
                                 v Process Job
                        +------------------+
                        |  BullMQ Worker   |
                        | - Rate Limiting  |
                        |   Check (Redis)  |
                        | - Min Delay      |
                        | - Ethereal SMTP  |
                        | - Slack Notify   |
                        +------------------+
```

---

## ⚙️ Detailed Engineering Specifications

### 1. How Scheduling Works (No Cron Jobs)
- When a user schedules an email batch, the backend API calculates the start timestamp (`scheduledAt`) and staggering delay:
  $$\text{staggerDelay}_i = \max(0, \text{scheduledAt} - \text{now}) + (i \times \text{delayBetweenEmailsSec} \times 1000)$$
- Each job is created in PostgreSQL with status `SCHEDULED`.
- BullMQ pushes a delayed job:
  ```ts
  await emailQueue.add('send-email', { emailJobId: emailJob.id }, { delay: staggerDelayMs, jobId: emailJob.id });
  ```
- BullMQ stores the job in a Redis Sorted Set (`zset`) scored by execution timestamp.

### 2. Persistence Across Server Restarts
- **Redis Queue Persistence**: Delayed jobs in Redis survive node/server crashes.
- **Idempotency Safeguard**: Each BullMQ job ID matches `emailJob.id`. If the server restarts, BullMQ worker picks up existing pending jobs from Redis without creating duplicates.

### 3. Rate Limiting & Concurrency Design
- **Worker Concurrency**: Worker processes up to `WORKER_CONCURRENCY` jobs in parallel.
- **Hourly Limit Logic**:
  - Redis key `ratelimit:sender:{senderId}:{YYYY-MM-DD-HH}` incremented via atomic `INCR`.
  - If counter exceeds `sender.hourlyLimit`:
    1. Calculates timestamp for next hour window start.
    2. Postpones job in BullMQ via `emailQueue.add(..., { delay: nextHourMs, jobId: `${id}-retry` })`.
    3. Updates job status in DB to `RATE_LIMITED`.
    4. Triggers Slack rate-limit notification.

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18+ (Tested on v25.2.1)
- **Docker Desktop**: Docker Compose v2+

### 1. Clone & Start Docker Infrastructure
```bash
git clone https://github.com/Ankurchoudhary75/email-scheduler.git
cd "email-scheduler"

# Start PostgreSQL (5433), Redis (6379), Elasticsearch (9200)
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install

# Run Prisma Database Migrations
npx prisma db push

# Start Backend Server in Dev Mode (Port 4000)
npm run dev
```

The backend server runs at `http://localhost:4000`.
- **BullBoard Queue Dashboard**: `http://localhost:4000/admin/queues`
- **Health Check**: `http://localhost:4000/health`

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install

# Start Next.js Frontend Dev Server (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5433/email_scheduler?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
ELASTICSEARCH_NODE="http://localhost:9200"

WORKER_CONCURRENCY=5
DEFAULT_MIN_DELAY_MS=2000
DEFAULT_HOURLY_LIMIT=200

GOOGLE_CLIENT_ID="your_google_client_id"
SLACK_CLIENT_ID="your_slack_client_id"
SLACK_CLIENT_SECRET="your_slack_client_secret"
SLACK_REDIRECT_URI="http://localhost:3000/slack/callback"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## 📹 Video Demo & Artifacts
- **Browser Interaction Recording**: Embedded in artifact workspace (`dashboard_ui_demo_1788701574838.webp`).
- **Live BullMQ Queue View**: Accessible at `http://localhost:4000/admin/queues`.

---

## 📋 Feature Verification Matrix

| Requirement | Implementation | Status |
| :--- | :--- | :---: |
| **No Cron Jobs** | BullMQ delayed queue jobs in Redis ZSET | ✅ Pass |
| **Relational DB** | PostgreSQL 16 + Prisma ORM | ✅ Pass |
| **Ethereal Fake SMTP** | Dynamic test account generation & preview URLs | ✅ Pass |
| **Elasticsearch Search** | Instant indexing & multi-match fuzzy search API | ✅ Pass |
| **BullBoard UI** | Exposed live queue viewer at `/admin/queues` | ✅ Pass |
| **Restart Safety** | Redis ZSET persistent queue + DB idempotency keys | ✅ Pass |
| **Hourly Rate Limiter** | Redis atomic hourly counters per sender with auto-postpone | ✅ Pass |
| **Slack Notifications** | Real Slack OAuth + webhook rate limit alerts | ✅ Pass |
| **Google Login** | Header profile displaying Avatar, Name, Email | ✅ Pass |
| **CSV Lead Parser** | Auto-extracts emails from CSV/text file upload | ✅ Pass |
| **Dashboard UI** | Figma-matched dark theme with stats & real-time polling | ✅ Pass |
