import axios from 'axios';
import { User, EmailJob, Stats, Sender } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async googleLogin(userData: { email: string; name?: string; avatarUrl?: string; googleId?: string }) {
    const res = await api.post<{ success: boolean; user: User }>('/auth/google-login', userData);
    return res.data;
  },

  async getProfile(userId: string) {
    const res = await api.get<User>('/auth/profile', {
      headers: { 'x-user-id': userId },
    });
    return res.data;
  },

  async getDashboardStats(userId?: string) {
    const res = await api.get<{ success: boolean; stats: Stats }>('/stats', {
      params: { userId },
    });
    return res.data.stats;
  },

  async getScheduledEmails(userId?: string) {
    const res = await api.get<{ success: boolean; data: EmailJob[] }>('/emails/scheduled', {
      params: { userId },
    });
    return res.data.data;
  },

  async getSentEmails(userId?: string) {
    const res = await api.get<{ success: boolean; data: EmailJob[] }>('/emails/sent', {
      params: { userId },
    });
    return res.data.data;
  },

  async searchEmails(query: string, status?: string, userId?: string) {
    const res = await api.get<{ success: boolean; source: string; data: EmailJob[] }>('/emails/search', {
      params: { q: query, status, userId },
    });
    return res.data;
  },

  async scheduleEmails(payload: {
    userId: string;
    senderId?: string;
    subject: string;
    body: string;
    recipients: string[];
    scheduledAt?: string;
    delayBetweenEmailsSec?: number;
    hourlyLimit?: number;
  }) {
    const res = await api.post<{ success: boolean; count: number; jobs: EmailJob[] }>('/emails/schedule', payload);
    return res.data;
  },

  async deleteEmailJob(id: string) {
    const res = await api.delete<{ success: boolean }>(`/emails/${id}`);
    return res.data;
  },

  async getSenders() {
    const res = await api.get<{ success: boolean; data: Sender[] }>('/emails/senders/all');
    return res.data.data;
  },

  async getSlackAuthUrl(userId: string) {
    const res = await api.get<{ success: boolean; url: string }>('/slack/url', {
      params: { userId },
    });
    return res.data.url;
  },

  async saveSlackWebhook(userId: string, webhookUrl: string, channel?: string) {
    const res = await api.post<{ success: boolean; message: string }>('/slack/webhook', {
      userId,
      webhookUrl,
      channel,
    });
    return res.data;
  },

  async getSlackStatus(userId: string) {
    const res = await api.get<{ success: boolean; slackConnected: boolean; channel?: string }>('/slack/status', {
      params: { userId },
    });
    return res.data;
  },

  async disconnectSlack(userId: string) {
    const res = await api.post<{ success: boolean }>('/slack/disconnect', { userId });
    return res.data;
  },
};
