import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';

dotenv.config();

import { prisma } from './config/prisma';
import { initElasticsearch } from './services/searchService';
import { emailQueue, bullQueueInstance } from './queues/emailQueue';

import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import slackRoutes from './routes/slackRoutes';
import statsRoutes from './routes/statsRoutes';

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup BullBoard Live Queue UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

try {
  if (bullQueueInstance) {
    createBullBoard({
      queues: [new BullMQAdapter(bullQueueInstance as any) as any],
      serverAdapter,
    });
  }
} catch (e) {}

app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ReachInbox Email Scheduler Backend API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #e2e8f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: linear-gradient(145deg, #131b2e, #1e293b);
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 36px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .dot {
      width: 8px;
      height: 8px;
      background-color: #10b981;
      border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
    h1 { margin: 0 0 10px; font-size: 24px; color: #f8fafc; }
    p { margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.5; }
    .links { display: flex; flex-direction: column; gap: 12px; }
    .btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #38bdf8;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: #1e293b;
      border-color: #38bdf8;
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> ReachInbox Backend API is Live</div>
    <h1>Email Scheduler Service</h1>
    <p>Node.js &bull; Express TypeScript &bull; BullMQ + Redis &bull; PostgreSQL &bull; Elasticsearch</p>
    <div class="links">
      <a class="btn" href="/admin/queues">
        <span>📊 <strong>BullBoard Queue UI</strong></span>
        <span>/admin/queues &rarr;</span>
      </a>
      <a class="btn" href="/api/stats">
        <span>📈 <strong>API Stats & Health</strong></span>
        <span>/api/stats &rarr;</span>
      </a>
      <a class="btn" href="https://contribution-unto-clusters-feof.trycloudflare.com" target="_blank">
        <span>🖥️ <strong>Open Frontend Dashboard</strong></span>
        <span>Open App &rarr;</span>
      </a>
    </div>
  </div>
</body>
</html>`);
    return;
  }
  res.json({
    name: 'ReachInbox Email Scheduler Service',
    status: 'ok',
    version: '1.0.0',
    bullBoard: '/admin/queues',
    stats: '/api/stats',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


import { ensureInfrastructureRunning } from './services/dockerGuardian';

async function bootstrap() {
  try {
    // 0. Automatically check and start Docker containers if stopped
    await ensureInfrastructureRunning();

    // 1. Init Elasticsearch index
    try {
      await initElasticsearch();
    } catch (err: any) {
      console.warn('[Bootstrap] Elasticsearch initialization notice (running fallback search):', err.message);
    }

    // 2. Ensure seed default sender exists in Database
    try {
      const count = await prisma.sender.count();
      if (count === 0) {
        await prisma.sender.create({
          data: {
            email: 'outbound@reachinbox.demo',
            name: 'ReachInbox Outbound Dispatcher',
            hourlyLimit: parseInt(process.env.DEFAULT_HOURLY_LIMIT || '200', 10),
            minDelayMs: parseInt(process.env.DEFAULT_MIN_DELAY_MS || '2000', 10),
          },
        });
        console.log('[Bootstrap] Created default Ethereal sender: outbound@reachinbox.demo');
      }
    } catch (err: any) {
      console.warn('[Bootstrap] Database seed notice:', err.message);
    }

    app.listen(port, () => {
      console.log(`====================================================`);
      console.log(`🚀 ReachInbox Email Job Scheduler Server Running!`);
      console.log(`📡 API Base URL:      http://localhost:${port}`);
      console.log(`📊 BullBoard Queue UI: http://localhost:${port}/admin/queues`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[Bootstrap] Server initialization error:', error);
  }
}

bootstrap();
