'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, EmailJob, Stats, Sender } from '../types';
import { apiService } from '../lib/api';
import { Header } from '../components/Header';
import { StatsCards } from '../components/StatsCards';
import { SearchBarAndTabs } from '../components/SearchBarAndTabs';
import { ScheduledTable } from '../components/ScheduledTable';
import { SentTable } from '../components/SentTable';
import { ComposeModal } from '../components/ComposeModal';
import { SlackModal } from '../components/SlackModal';
import { Mail, Sparkles, Server, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [scheduledJobs, setScheduledJobs] = useState<EmailJob[]>([]);
  const [sentJobs, setSentJobs] = useState<EmailJob[]>([]);
  const [searchResults, setSearchResults] = useState<EmailJob[] | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [searchSource, setSearchSource] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'sent' | 'failed' | 'rate_limited'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSlackOpen, setIsSlackOpen] = useState(false);

  // Initialize or fetch User
  useEffect(() => {
    const savedUser = localStorage.getItem('reachinbox_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Refresh profile status from API
        apiService
          .getProfile(parsed.id)
          .then((updated) => {
            setUser(updated);
            localStorage.setItem('reachinbox_user', JSON.stringify(updated));
          })
          .catch(() => {});
      } catch (e) {
        // Fallback demo user
      }
    } else {
      // Auto demo sign in for seamless testing!
      handleGoogleLogin();
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await apiService.googleLogin({
        email: 'ankur.demo@reachinbox.ai',
        name: 'Ankur Choudhary',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      });
      setUser(res.user);
      localStorage.setItem('reachinbox_user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('reachinbox_user');
  };

  // Fetch Dashboard Data
  const fetchData = useCallback(async () => {
    try {
      const [statsData, scheduledData, sentData, sendersData] = await Promise.all([
        apiService.getDashboardStats(user?.id),
        apiService.getScheduledEmails(user?.id),
        apiService.getSentEmails(user?.id),
        apiService.getSenders(),
      ]);

      setStats(statsData);
      setScheduledJobs(scheduledData);
      setSentJobs(sentData);
      setSenders(sendersData);
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Live polling every 3 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle Search via Elasticsearch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchSource('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiService.searchEmails(searchQuery.trim(), undefined, user?.id);
        setSearchResults(res.data);
        setSearchSource(res.source);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleScheduleCampaign = async (payload: {
    subject: string;
    body: string;
    recipients: string[];
    scheduledAt?: string;
    delayBetweenEmailsSec: number;
    hourlyLimit: number;
    senderId?: string;
  }) => {
    if (!user) {
      await handleGoogleLogin();
    }
    const currentUserId = user?.id || (await apiService.googleLogin({ email: 'ankur.demo@reachinbox.ai' })).user.id;

    await apiService.scheduleEmails({
      ...payload,
      userId: currentUserId,
    });

    fetchData();
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await apiService.deleteEmailJob(id);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filtered Job Lists
  const allJobs = [...scheduledJobs, ...sentJobs];

  const getDisplayedJobs = () => {
    if (searchResults !== null) {
      return searchResults;
    }

    switch (activeTab) {
      case 'scheduled':
        return scheduledJobs.filter((j) => j.status === 'SCHEDULED');
      case 'rate_limited':
        return scheduledJobs.filter((j) => j.status === 'RATE_LIMITED');
      case 'sent':
        return sentJobs.filter((j) => j.status === 'SENT');
      case 'failed':
        return sentJobs.filter((j) => j.status === 'FAILED');
      case 'all':
      default:
        return allJobs;
    }
  };

  const displayedJobs = getDisplayedJobs();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <Header
        user={user}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenSlackModal={() => setIsSlackOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome / Banner */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-violet-900/20 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>BullMQ + Redis Persistent Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Full-stack Email Job Scheduler & Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Schedule bulk email campaigns with custom provider throttling, automatic hourly rate-limiting, live Slack notification alerts, and full server restart persistence.
              </p>
            </div>

            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              <Mail className="h-4 w-4" />
              <span>Compose Campaign</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <StatsCards stats={stats} />

        {/* Search Bar & Filter Tabs */}
        <SearchBarAndTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={fetchData}
          searchSource={searchSource}
        />

        {/* Data Tables */}
        {activeTab === 'sent' || activeTab === 'failed' ? (
          <SentTable
            jobs={displayedJobs.filter((j) => j.status === 'SENT' || j.status === 'FAILED')}
            loading={loading}
            onOpenCompose={() => setIsComposeOpen(true)}
          />
        ) : activeTab === 'scheduled' || activeTab === 'rate_limited' ? (
          <ScheduledTable
            jobs={displayedJobs.filter((j) => j.status === 'SCHEDULED' || j.status === 'RATE_LIMITED' || j.status === 'PROCESSING')}
            loading={loading}
            onDelete={handleDeleteJob}
            onOpenCompose={() => setIsComposeOpen(true)}
          />
        ) : (
          /* All Jobs view */
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Scheduled & Rate-Limited Jobs</span>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {scheduledJobs.length}
                  </span>
                </h3>
              </div>
              <ScheduledTable
                jobs={scheduledJobs}
                loading={loading}
                onDelete={handleDeleteJob}
                onOpenCompose={() => setIsComposeOpen(true)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Sent & Delivery Log</span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {sentJobs.length}
                  </span>
                </h3>
              </div>
              <SentTable
                jobs={sentJobs}
                loading={loading}
                onOpenCompose={() => setIsComposeOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSchedule={handleScheduleCampaign}
        senders={senders}
      />

      {/* Slack Connection Modal */}
      {user && (
        <SlackModal
          isOpen={isSlackOpen}
          onClose={() => setIsSlackOpen(false)}
          userId={user.id}
          isSlackConnected={user.slackConnected}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
