import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { getSlackOAuthUrl, handleSlackOAuthCallback, sendSlackRateLimitNotification } from '../services/slackService';

export async function getSlackAuthUrl(req: Request, res: Response) {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const url = getSlackOAuthUrl(userId);
    return res.json({ success: true, url });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate Slack OAuth URL' });
  }
}

export async function slackOAuthCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'OAuth code missing' });
    }

    const userId = typeof state === 'string' ? state : undefined;
    if (!userId) {
      return res.status(400).json({ error: 'State (userId) missing' });
    }

    const result = await handleSlackOAuthCallback(code, userId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Slack OAuth callback failed' });
  }
}

export async function saveSlackWebhook(req: Request, res: Response) {
  try {
    const { userId, webhookUrl, channel } = req.body;
    if (!userId || !webhookUrl) {
      return res.status(400).json({ error: 'userId and webhookUrl are required' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        slackWebhookUrl: webhookUrl,
        slackChannel: channel || 'general',
      },
    });

    // Send test notification to verify live integration!
    await sendSlackRateLimitNotification(
      userId,
      'test-sender@reachinbox.demo',
      200,
      201,
      new Date(Date.now() + 3600000)
    );

    return res.json({
      success: true,
      message: 'Slack Incoming Webhook connected successfully. Sent test verification notification!',
      slackConnected: true,
    });
  } catch (error: any) {
    console.error('[Slack Controller] Webhook save error:', error);
    return res.status(500).json({ error: 'Failed to connect Slack webhook' });
  }
}

export async function getSlackStatus(req: Request, res: Response) {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      slackConnected: !!(user.slackWebhookUrl || user.slackAccessToken),
      channel: user.slackChannel || null,
      teamId: user.slackTeamId || null,
      hasWebhook: !!user.slackWebhookUrl,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to get Slack status' });
  }
}

export async function disconnectSlack(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        slackAccessToken: null,
        slackTeamId: null,
        slackWebhookUrl: null,
        slackChannel: null,
      },
    });

    return res.json({ success: true, message: 'Slack disconnected successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to disconnect Slack' });
  }
}
