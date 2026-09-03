import axios from 'axios';
import { prisma } from '../config/prisma';

export function getSlackOAuthUrl(userId: string) {
  const clientId = process.env.SLACK_CLIENT_ID || '';
  const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/slack/callback');
  const scope = encodeURIComponent('incoming-webhook,chat:write');

  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${userId}`;
}

export async function handleSlackOAuthCallback(code: string, userId: string) {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/slack/callback';

    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: clientId || '',
        client_secret: clientSecret || '',
        code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.ok) {
      const { access_token, team, incoming_webhook } = response.data;
      const webhookUrl = incoming_webhook ? incoming_webhook.url : null;
      const channel = incoming_webhook ? incoming_webhook.channel : null;

      await prisma.user.update({
        where: { id: userId },
        data: {
          slackAccessToken: access_token,
          slackTeamId: team ? team.id : null,
          slackWebhookUrl: webhookUrl,
          slackChannel: channel,
        },
      });

      return { success: true, teamName: team ? team.name : 'Slack Workspace', channel };
    } else {
      console.warn('[Slack OAuth] Access token exchange failed or mocked:', response.data?.error);
      return { success: false, error: response.data?.error || 'OAuth token exchange failed' };
    }
  } catch (error: any) {
    console.error('[Slack OAuth] Callback error:', error.message);
    throw error;
  }
}

export async function sendSlackRateLimitNotification(
  userId: string,
  senderEmail: string,
  hourlyLimit: number,
  currentCount: number,
  rescheduledTo: Date
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (!user.slackWebhookUrl && !user.slackAccessToken)) {
    // User hasn't connected Slack -> do nothing silently (no crash)
    console.log(`[Slack Notification] User ${userId} has not connected Slack. Skipping alert.`);
    return;
  }

  const payload = {
    text: `⚠️ Rate Limit Reached for Sender ${senderEmail}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 ReachInbox Scheduler: Hourly Rate Limit Hit',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Sender Account:*\n\`${senderEmail}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Configured Hourly Limit:*\n\`${hourlyLimit} emails/hour\``,
          },
          {
            type: 'mrkdwn',
            text: `*Emails Sent This Hour:*\n\`${currentCount} / ${hourlyLimit}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Rescheduled Next Run:*\n\`${rescheduledTo.toLocaleTimeString()} (${rescheduledTo.toLocaleDateString()})\``,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '⚡ BullMQ delayed queue automatically preserved job order and postponed remaining emails to the next hour window.',
          },
        ],
      },
    ],
  };

  try {
    if (user.slackWebhookUrl) {
      await axios.post(user.slackWebhookUrl, payload);
      console.log(`[Slack Notification] Live rate-limit webhook sent to Slack for user ${user.email}`);
    } else if (user.slackAccessToken && user.slackChannel) {
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel: user.slackChannel,
        ...payload,
      }, {
        headers: {
          Authorization: `Bearer ${user.slackAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`[Slack Notification] Live chat message posted to Slack for user ${user.email}`);
    }
  } catch (error: any) {
    console.error(`[Slack Notification] Failed to dispatch Slack alert (non-fatal):`, error.message);
  }
}
