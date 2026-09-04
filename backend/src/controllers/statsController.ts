import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/emailQueue';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const where: any = {};
    if (userId) where.userId = userId;

    const totalScheduled = await prisma.emailJob.count({
      where: { ...where, status: 'SCHEDULED' },
    });

    const totalRateLimited = await prisma.emailJob.count({
      where: { ...where, status: 'RATE_LIMITED' },
    });

    const totalSent = await prisma.emailJob.count({
      where: { ...where, status: 'SENT' },
    });

    const totalFailed = await prisma.emailJob.count({
      where: { ...where, status: 'FAILED' },
    });

    // Fetch live BullMQ queue counts
    const waitingCount = await emailQueue.getWaitingCount();
    const delayedCount = await emailQueue.getDelayedCount();
    const activeCount = await emailQueue.getActiveCount();

    return res.json({
      success: true,
      stats: {
        totalScheduled,
        totalRateLimited,
        totalSent,
        totalFailed,
        queue: {
          waiting: waitingCount,
          delayed: delayedCount,
          active: activeCount,
        },
      },
    });
  } catch (error: any) {
    console.error('[Stats Controller] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
