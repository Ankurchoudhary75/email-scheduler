import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/emailQueue';
import { searchEmails, indexEmailDoc } from '../services/searchService';

export async function scheduleEmails(req: Request, res: Response) {
  try {
    const {
      userId,
      senderId,
      subject,
      body,
      recipients,
      scheduledAt,
      delayBetweenEmailsSec = 2,
      hourlyLimit = 200,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Ensure User exists in PostgreSQL
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@demo.local`,
        name: 'Demo User',
      },
    });

    if (!subject || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'subject, body, and recipients array are required' });
    }

    // Check or get default sender
    let targetSenderId = senderId;
    if (!targetSenderId) {
      const defaultSender = await prisma.sender.findFirst();
      if (!defaultSender) {
        const createdSender = await prisma.sender.create({
          data: {
            email: 'scheduler@reachinbox.demo',
            name: 'ReachInbox Dispatcher',
            hourlyLimit: Number(hourlyLimit) || 200,
            minDelayMs: (Number(delayBetweenEmailsSec) || 2) * 1000,
          },
        });
        targetSenderId = createdSender.id;
      } else {
        targetSenderId = defaultSender.id;
      }
    }

    // Update sender configuration if custom values passed
    if (hourlyLimit || delayBetweenEmailsSec) {
      await prisma.sender.update({
        where: { id: targetSenderId },
        data: {
          hourlyLimit: Number(hourlyLimit) || 200,
          minDelayMs: (Number(delayBetweenEmailsSec) || 2) * 1000,
        },
      });
    }

    const sender = await prisma.sender.findUnique({ where: { id: targetSenderId } });
    if (!sender) {
      return res.status(400).json({ error: 'Invalid sender ID' });
    }

    const startTimestamp = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
    const nowMs = Date.now();
    const baseDelayFromNow = Math.max(0, startTimestamp - nowMs);
    const delayStepMs = (Number(delayBetweenEmailsSec) || 2) * 1000;

    const createdJobs: any[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i].trim();
      if (!recipientEmail) continue;

      const staggerDelayMs = baseDelayFromNow + i * delayStepMs;
      const targetScheduledAt = new Date(nowMs + staggerDelayMs);

      // Create record in Database first
      const emailJob = await prisma.emailJob.create({
        data: {
          userId,
          senderId: targetSenderId,
          recipient: recipientEmail,
          subject,
          body,
          scheduledAt: targetScheduledAt,
          status: 'SCHEDULED',
        },
      });

      // Push delayed job to BullMQ queue using emailJob.id as BullMQ jobId for idempotency
      const bullJob = await emailQueue.add(
        'send-email',
        { emailJobId: emailJob.id },
        {
          delay: Math.max(staggerDelayMs, 0),
          jobId: emailJob.id,
        }
      );

      // Update emailJob with jobId reference
      const updatedJob = await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: { jobId: bullJob.id },
      });

      // Index in Elasticsearch
      await indexEmailDoc(updatedJob, sender.email);

      createdJobs.push(updatedJob);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully scheduled ${createdJobs.length} emails`,
      count: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (error: any) {
    console.error('[Email Controller] Schedule error:', error);
    return res.status(500).json({ error: 'Failed to schedule email batch' });
  }
}

export async function getScheduledEmails(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const whereCondition: any = {
      status: { in: ['SCHEDULED', 'RATE_LIMITED', 'PROCESSING'] },
    };
    if (userId) whereCondition.userId = userId;

    const jobs = await prisma.emailJob.findMany({
      where: whereCondition,
      include: { sender: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error: any) {
    console.error('[Email Controller] Get scheduled error:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
}

export async function getSentEmails(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const whereCondition: any = {
      status: { in: ['SENT', 'FAILED'] },
    };
    if (userId) whereCondition.userId = userId;

    const jobs = await prisma.emailJob.findMany({
      where: whereCondition,
      include: { sender: true },
      orderBy: [{ sentAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error: any) {
    console.error('[Email Controller] Get sent error:', error);
    return res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
}

export async function searchEmailsRoute(req: Request, res: Response) {
  try {
    const { q, status, userId } = req.query;

    const queryStr = typeof q === 'string' ? q : '';
    const statusStr = typeof status === 'string' ? status : undefined;
    const userIdStr = typeof userId === 'string' ? userId : undefined;

    // Try Elasticsearch first
    const esResults = await searchEmails(queryStr, statusStr, userIdStr);
    if (esResults !== null) {
      return res.json({
        success: true,
        source: 'elasticsearch',
        count: esResults.length,
        data: esResults,
      });
    }

    // Fallback to PostgreSQL search
    console.log('[Search] Falling back to PostgreSQL DB query');
    const where: any = {};
    if (userIdStr) where.userId = userIdStr;
    if (statusStr) where.status = statusStr;
    if (queryStr) {
      where.OR = [
        { recipient: { contains: queryStr, mode: 'insensitive' } },
        { subject: { contains: queryStr, mode: 'insensitive' } },
        { body: { contains: queryStr, mode: 'insensitive' } },
      ];
    }

    const dbResults = await prisma.emailJob.findMany({
      where,
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      source: 'database',
      count: dbResults.length,
      data: dbResults,
    });
  } catch (error: any) {
    console.error('[Email Controller] Search error:', error);
    return res.status(500).json({ error: 'Search operation failed' });
  }
}

export async function deleteEmailJob(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const emailJob = await prisma.emailJob.findUnique({ where: { id } });
    if (!emailJob) {
      return res.status(404).json({ error: 'Email job not found' });
    }

    if (emailJob.jobId) {
      try {
        const job = await emailQueue.getJob(emailJob.jobId);
        if (job) {
          await job.remove();
        }
      } catch (err) {
        console.warn(`[BullMQ] Could not remove job ${emailJob.jobId} from queue:`, err);
      }
    }

    await prisma.emailJob.delete({ where: { id } });

    return res.json({ success: true, message: 'Email job removed successfully' });
  } catch (error: any) {
    console.error('[Email Controller] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete email job' });
  }
}

export async function getSenders(req: Request, res: Response) {
  try {
    const senders = await prisma.sender.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ success: true, data: senders });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch senders' });
  }
}
