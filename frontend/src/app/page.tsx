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
import { LoginModal } from '../components/LoginModal';
import { Mail, Sparkles, Zap, ArrowRight, Layers, Send } from 'lucide-react';

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
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Initialize or fetch User
  useEffect(() => {
    const savedUser = localStorage.getItem('reachinbox_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        apiService
          .getProfile(parsed.id)
          .then((updated) => {
            setUser(updated);
            localStorage.setItem('reachinbox_user', JSON.stringify(updated));
          })
          .catch(() => {});
      } catch (e) {}
    } else {
      handlePerformLogin({
        email: 'ankur.demo@reachinbox.ai',
        name: 'Ankur Choudhary',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      });
    }
  }, []);

  const handlePerformLogin = async (userData: { email: string; name?: string; avatarUrl?: string }) => {
    try {
      const res = await apiService.googleLogin(userData);
      setUser(res.user);
      localStorage.setItem('reachinbox_user', JSON.stringify(res.user));
      return res.user;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    }
  };

  const handleGoogleLogin = async () => {
    return handlePerformLogin({
      email: 'ankur.demo@reachinbox.ai',
      name: 'Ankur Choudhary',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    });
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <Header
        user={user}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenCompose={() => setIsComposeOpen(true)}
        onOpenSlackModal={() => setIsSlackOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome / Hero Banner */}
        <div className="bg-gradient-to-r from-amber-950/60 via-orange-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute -right-12 -top-12 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-12 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Production-Grade Distributed Email Queue</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Email Job Scheduler &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400">
                  Analytics Dashboard
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Schedule email outreach with custom provider throttling, automatic hourly rate-limit windowing, live Slack notifications, and instant Elasticsearch search.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 transition cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Mail className="h-4 w-4 stroke-[3]" />
                <span>Compose New Campaign</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleScheduleCampaign({
                    subject: '🚀 Welcome to ReachInbox Outbound Demo',
                    body: '<h1>Hello!</h1><p>This is an automated test campaign sent through BullMQ with Redis persistence and Ethereal SMTP transport.</p>',
                    recipients: ['sarah.demo@acmecorp.io', 'alex.tester@enterprise.dev'],
                    delayBetweenEmailsSec: 2,
                    hourlyLimit: 200,
                  })
                }
                className="flex items-center justify-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-bold text-xs px-4 py-3.5 rounded-2xl transition cursor-pointer shadow-md"
                title="1-Click Quick Demo"
              >
                <Send className="h-3.5 w-3.5 text-amber-400" />
                <span>⚡ 1-Click Test (2 Leads)</span>
              </button>
            </div>
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
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-black text-white flex items-center space-x-2 tracking-wide uppercase">
                  <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                  <span>Scheduled & Rate-Limited Jobs</span>
                  <span className="text-xs font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
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
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-black text-white flex items-center space-x-2 tracking-wide uppercase">
                  <Layers className="h-4 w-4 text-teal-400" />
                  <span>Sent & Delivery Audit Log</span>
                  <span className="text-xs font-extrabold text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-500/40">
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

      {/* Google Sign In / Switch User Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handlePerformLogin}
        currentUser={user}
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
