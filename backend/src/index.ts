import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';

dotenv.config();

import { prisma } from './config/prisma';
import { initElasticsearch } from './services/searchService';
import { emailQueue } from './queues/emailQueue';

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

createBullBoard({
  queues: [new BullMQAdapter(emailQueue as any) as any],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function bootstrap() {
  try {
    // 1. Init Elasticsearch index
    await initElasticsearch();

    // 2. Ensure seed default sender exists in Database
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

    app.listen(port, () => {
      console.log(`====================================================`);
      console.log(`🚀 ReachInbox Email Job Scheduler Server Running!`);
      console.log(`📡 API Base URL:      http://localhost:${port}`);
      console.log(`📊 BullBoard Queue UI: http://localhost:${port}/admin/queues`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[Bootstrap] Server initialization failed:', error);
    process.exit(1);
  }
}

bootstrap();
