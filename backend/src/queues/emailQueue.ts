import { Queue, Worker, Job } from 'bullmq';
import { redisConnectionOptions, redisClient } from '../config/redis';
import { prisma } from '../config/prisma';
import { sendEmailViaEthereal } from '../services/etherealService';
import { sendSlackRateLimitNotification } from '../services/slackService';
import { indexEmailDoc } from '../services/searchService';

export const EMAIL_QUEUE_NAME = 'email-scheduler-queue';

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

/**
 * Core email processing function shared across BullMQ Worker and Embedded Queue Runner
 */
export async function processEmailJob(emailJobId: string): Promise<void> {
  const emailJob = await prisma.emailJob.findUnique({
    where: { id: emailJobId },
    include: { sender: true, user: true },
  });

  if (!emailJob) {
    console.warn(`[Queue Worker] EmailJob ${emailJobId} not found. Skipping.`);
    return;
  }

  if (emailJob.status === 'SENT') {
    return;
  }

  const { sender, userId, recipient, subject, body } = emailJob;
  const now = new Date();
  const hourWindow = getHourWindowString(now);
  const redisLimitKey = `ratelimit:sender:${sender.id}:${hourWindow}`;

  // Check rate limiting via Redis or local storage
  let currentHourlyCount = 1;
  try {
    currentHourlyCount = await redisClient.incr(redisLimitKey);
    if (currentHourlyCount === 1) {
      await redisClient.expire(redisLimitKey, 3600);
    }
  } catch {
    currentHourlyCount = 1;
  }

  const maxLimit = sender.hourlyLimit || parseInt(process.env.DEFAULT_HOURLY_LIMIT || '200', 10);

  if (currentHourlyCount > maxLimit) {
    const nextHourDate = getNextHourDate(now);
    const delayMs = nextHourDate.getTime() - now.getTime();

    console.warn(
      `[Worker Rate Limit] Sender ${sender.email} reached limit (${currentHourlyCount}/${maxLimit}). Rescheduling for ${nextHourDate.toISOString()}`
    );

    try {
      await redisClient.decr(redisLimitKey);
    } catch {}

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'RATE_LIMITED',
        error: `Hourly rate limit of ${maxLimit} reached. Postponed to ${nextHourDate.toLocaleTimeString()}`,
      },
    });

    // Dispatch Slack alert if connected
    await sendSlackRateLimitNotification(userId, sender.email, maxLimit, currentHourlyCount - 1, nextHourDate);

    // Reschedule
    await emailQueue.add(
      'send-email',
      { emailJobId },
      { delay: Math.max(delayMs, 1000), jobId: `${emailJobId}-retry-${nextHourDate.getTime()}` }
    );
    return;
  }

  // Set status to PROCESSING
  await prisma.emailJob.update({
    where: { id: emailJobId },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  });

  try {
    const minDelay = sender.minDelayMs || parseInt(process.env.DEFAULT_MIN_DELAY_MS || '2000', 10);
    if (minDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, minDelay));
    }

    // Send email via Ethereal Fake SMTP
    const result = await sendEmailViaEthereal(
      sender.id,
      sender.email,
      sender.name,
      recipient,
      subject,
      body
    );

    const sentTime = new Date();

    const updatedJob = await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'SENT',
        sentAt: sentTime,
        etherealPreviewUrl: result.previewUrl || null,
        error: null,
      },
    });

    // Index in Elasticsearch
    await indexEmailDoc(updatedJob, sender.email);

    // Record rate limit log
    await prisma.rateLimitLog.upsert({
      where: { senderId_hourWindow: { senderId: sender.id, hourWindow } },
      update: { count: { increment: 1 } },
      create: { senderId: sender.id, hourWindow, count: 1 },
    });

    console.log(`✅ [Queue Success] Email sent to ${recipient}. Preview: ${result.previewUrl}`);
  } catch (err: any) {
    console.error(`❌ [Queue Failure] Failed to send email ${emailJobId}:`, err.message);

    const failedJob = await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'FAILED',
        error: err.message || 'SMTP sending error',
      },
    });

    await indexEmailDoc(failedJob, sender.email);
  }
}

// In-Memory Fallback Queue registry for Zero-Docker mode
const embeddedTimers = new Map<string, NodeJS.Timeout>();
let embeddedWaitingCount = 0;
let embeddedDelayedCount = 0;
let embeddedActiveCount = 0;

export let bullQueueInstance: any = null;
let bullWorkerInstance: any = null;

try {
  bullQueueInstance = new Queue(EMAIL_QUEUE_NAME, {
    connection: redisConnectionOptions,
  });

  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
  bullWorkerInstance = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job<{ emailJobId: string }>) => {
      await processEmailJob(job.data.emailJobId);
    },
    {
      connection: redisConnectionOptions,
      concurrency,
    }
  );

  bullWorkerInstance.on('error', (_err: any) => {
    // Suppress unhandled redis reconnect errors in console
  });
} catch {
  // Use embedded mode
}

export const emailQueue = {
  async add(name: string, data: { emailJobId: string }, opts: any = {}) {
    const delay = opts.delay || 0;
    const jobId = opts.jobId || data.emailJobId;

    if (bullQueueInstance) {
      try {
        return await bullQueueInstance.add(name, data, opts);
      } catch {
        // Fallback to embedded timer if Redis push fails
      }
    }

    // Embedded in-memory persistent timer
    if (delay > 0) {
      embeddedDelayedCount++;
    } else {
      embeddedWaitingCount++;
    }

    const timer = setTimeout(async () => {
      embeddedTimers.delete(jobId);
      if (delay > 0) embeddedDelayedCount = Math.max(0, embeddedDelayedCount - 1);
      else embeddedWaitingCount = Math.max(0, embeddedWaitingCount - 1);

      embeddedActiveCount++;
      try {
        await processEmailJob(data.emailJobId);
      } finally {
        embeddedActiveCount = Math.max(0, embeddedActiveCount - 1);
      }
    }, Math.max(0, delay));

    embeddedTimers.set(jobId, timer);
    return { id: jobId, name, data, opts };
  },

  async getJob(id: string) {
    if (bullQueueInstance) {
      try {
        return await bullQueueInstance.getJob(id);
      } catch {}
    }
    return null;
  },

  async remove(id: string) {
    if (embeddedTimers.has(id)) {
      clearTimeout(embeddedTimers.get(id)!);
      embeddedTimers.delete(id);
    }
    if (bullQueueInstance) {
      try {
        const job = await bullQueueInstance.getJob(id);
        if (job) await job.remove();
      } catch {}
    }
  },

  async getWaitingCount() {
    if (bullQueueInstance) {
      try {
        return await bullQueueInstance.getWaitingCount();
      } catch {}
    }
    return embeddedWaitingCount;
  },

  async getDelayedCount() {
    if (bullQueueInstance) {
      try {
        return await bullQueueInstance.getDelayedCount();
      } catch {}
    }
    return embeddedDelayedCount;
  },

  async getActiveCount() {
    if (bullQueueInstance) {
      try {
        return await bullQueueInstance.getActiveCount();
      } catch {}
    }
    return embeddedActiveCount;
  },
};
