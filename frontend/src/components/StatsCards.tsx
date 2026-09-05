'use client';

import React from 'react';
import { Stats } from '../types';
import { Clock, CheckCircle2, ShieldAlert, AlertTriangle, Cpu } from 'lucide-react';

interface StatsCardsProps {
  stats: Stats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="space-y-4">
      {/* Top 4 Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled Jobs */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Scheduled Jobs</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats ? stats.totalScheduled : 0}
            </span>
            <span className="text-xs text-indigo-400 font-medium">Pending queue</span>
          </div>
        </div>

        {/* Sent Emails */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sent Emails</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats ? stats.totalSent : 0}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Delivered via SMTP</span>
          </div>
        </div>

        {/* Rate Limited */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rate Limited</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats ? stats.totalRateLimited : 0}
            </span>
            <span className="text-xs text-amber-400 font-medium">Postponed to next hr</span>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Failed</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats ? stats.totalFailed : 0}
            </span>
            <span className="text-xs text-rose-400 font-medium">SMTP Errors</span>
          </div>
        </div>
      </div>

      {/* BullMQ Live Status Ticker */}
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span className="font-medium text-slate-300">BullMQ Redis Queue Engine</span>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px]">
          <div>
            <span className="text-slate-500 mr-1">Waiting:</span>
            <span className="text-indigo-300 font-semibold">{stats?.queue?.waiting || 0}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">Delayed:</span>
            <span className="text-amber-300 font-semibold">{stats?.queue?.delayed || 0}</span>
          </div>
          <div>
            <span className="text-slate-500 mr-1">Active:</span>
            <span className="text-emerald-300 font-semibold">{stats?.queue?.active || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
