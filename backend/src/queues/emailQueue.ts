import { Queue, Worker, Job } from 'bullmq';
import { redisConnectionOptions, redisClient } from '../config/redis';
import { prisma } from '../config/prisma';
import { sendEmailViaEthereal } from '../services/etherealService';
import { sendSlackRateLimitNotification } from '../services/slackService';
import { indexEmailDoc } from '../services/searchService';

export const EMAIL_QUEUE_NAME = 'email-scheduler-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800 },
  },
});

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

function getHourWindowString(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}`;
}

function getNextHourDate(date: Date): Date {
  const next = new Date(date);
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
  return next;
}

export const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job: Job<{ emailJobId: string }>) => {
    const { emailJobId } = job.data;

    // Fetch EmailJob from PostgreSQL
    const emailJob = await prisma.emailJob.findUnique({
      where: { id: emailJobId },
      include: { sender: true, user: true },
    });

    if (!emailJob) {
      console.warn(`[Worker] EmailJob ${emailJobId} not found in database. Skipping.`);
      return;
    }

    if (emailJob.status === 'SENT') {
      console.log(`[Worker] EmailJob ${emailJobId} is already SENT. Idempotency check passed.`);
      return;
    }

    const { sender, userId, recipient, subject, body } = emailJob;
    const now = new Date();
    const hourWindow = getHourWindowString(now);
    const redisLimitKey = `ratelimit:sender:${sender.id}:${hourWindow}`;

    // 1. Check & Increment Hourly Rate Limit in Redis (Atomic)
    const currentHourlyCount = await redisClient.incr(redisLimitKey);
    if (currentHourlyCount === 1) {
      await redisClient.expire(redisLimitKey, 3600); // 1 hour TTL
    }

    const maxLimit = sender.hourlyLimit || parseInt(process.env.DEFAULT_HOURLY_LIMIT || '200', 10);

    if (currentHourlyCount > maxLimit) {
      const nextHourDate = getNextHourDate(now);
      const delayMs = nextHourDate.getTime() - now.getTime();

      console.warn(
        `[Worker Rate Limit] Sender ${sender.email} hit limit (${currentHourlyCount}/${maxLimit}). Rescheduling job ${emailJobId} for ${nextHourDate.toISOString()}`
      );

      // Decrement count since we didn't send
      await redisClient.decr(redisLimitKey);

      // Update DB status
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: 'RATE_LIMITED',
          error: `Hourly rate limit of ${maxLimit} reached. Postponed to ${nextHourDate.toLocaleTimeString()}`,
        },
      });

      // Dispatch Slack Notification if user has connected Slack
      await sendSlackRateLimitNotification(userId, sender.email, maxLimit, currentHourlyCount - 1, nextHourDate);

      // Reschedule BullMQ delayed job for the next hour window
      await emailQueue.add(
        'send-email',
        { emailJobId },
        {
          delay: Math.max(delayMs, 1000),
          jobId: `${emailJobId}-retry-${nextHourDate.getTime()}`,
        }
      );

      return;
    }

    // Update status to PROCESSING
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });

    try {
      // 2. Minimum delay throttling between email sends
      const minDelay = sender.minDelayMs || parseInt(process.env.DEFAULT_MIN_DELAY_MS || '2000', 10);
      if (minDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, minDelay));
      }

      // 3. Send email via Ethereal SMTP
      const result = await sendEmailViaEthereal(
        sender.id,
        sender.email,
        sender.name,
        recipient,
        subject,
        body
      );

      const sentTime = new Date();

      // 4. Update Database
      const updatedJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: 'SENT',
          sentAt: sentTime,
          etherealPreviewUrl: result.previewUrl || null,
          error: null,
        },
      });

      // 5. Index Document in Elasticsearch
      await indexEmailDoc(updatedJob, sender.email);

      // 6. Record Rate Limit Log in DB
      await prisma.rateLimitLog.upsert({
        where: { senderId_hourWindow: { senderId: sender.id, hourWindow } },
        update: { count: { increment: 1 } },
        create: { senderId: sender.id, hourWindow, count: 1 },
      });

      console.log(`[Worker Success] Email ${emailJobId} sent to ${recipient}. Preview: ${result.previewUrl}`);
    } catch (err: any) {
      console.error(`[Worker Failure] Failed to send email ${emailJobId}:`, err.message);

      const failedJob = await prisma.emailJob.update({
        where: { id: emailJobId },
        data: {
          status: 'FAILED',
          error: err.message || 'SMTP sending error',
        },
      });

      // Index failure state in Elasticsearch
      await indexEmailDoc(failedJob, sender.email);
      throw err;
    }
  },
  {
    connection: redisConnectionOptions,
    concurrency,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
});
