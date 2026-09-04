export type EmailStatus = 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RATE_LIMITED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  slackConnected: boolean;
  slackChannel?: string;
}

export interface Sender {
  id: string;
  email: string;
  name: string;
  hourlyLimit: number;
  minDelayMs: number;
}

export interface EmailJob {
  id: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string;
  status: EmailStatus;
  jobId?: string;
  etherealPreviewUrl?: string;
  error?: string;
  attempts?: number;
  createdAt: string;
  updatedAt: string;
  sender?: Sender;
}

export interface Stats {
  totalScheduled: number;
  totalRateLimited: number;
  totalSent: number;
  totalFailed: number;
  queue: {
    waiting: number;
    delayed: number;
    active: number;
  };
}
