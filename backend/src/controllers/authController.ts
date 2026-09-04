import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export async function googleLogin(req: Request, res: Response) {
  try {
    const { email, name, avatarUrl, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || 'Demo User',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        googleId: googleId || `google-demo-${Date.now()}`,
      },
      create: {
        email,
        name: name || 'Demo User',
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        googleId: googleId || `google-demo-${Date.now()}`,
      },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        slackConnected: !!(user.slackWebhookUrl || user.slackAccessToken),
        slackChannel: user.slackChannel,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller] Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Missing User ID header' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      slackConnected: !!(user.slackWebhookUrl || user.slackAccessToken),
      slackChannel: user.slackChannel,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}
