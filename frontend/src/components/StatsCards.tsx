'use client';

import React from 'react';
import { Stats } from '../types';
import { Clock, CheckCircle2, ShieldAlert, AlertTriangle, Cpu, Zap, Activity } from 'lucide-react';

interface StatsCardsProps {
  stats: Stats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="space-y-4">
      {/* Top 4 Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scheduled Jobs - Emerald Green */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-emerald-400 transition shadow-xl hover:shadow-emerald-500/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Scheduled Jobs</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2 relative z-10">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats ? stats.totalScheduled : 0}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Pending queue
            </span>
          </div>
        </div>

        {/* Sent Emails - Electric Green / Teal */}
        <div className="bg-gradient-to-br from-teal-950/40 via-slate-900/80 to-slate-950 border border-teal-500/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-teal-400 transition shadow-xl hover:shadow-teal-500/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Sent Emails</span>
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2 relative z-10">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats ? stats.totalSent : 0}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Ethereal SMTP
            </span>
          </div>
        </div>

        {/* Rate Limited - Electric Yellow / Amber */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-950 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-amber-400 transition shadow-xl hover:shadow-amber-500/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Rate Limited</span>
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2 relative z-10">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats ? stats.totalRateLimited : 0}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Postponed to next hr
            </span>
          </div>
        </div>

        {/* Failed - Orange / Coral */}
        <div className="bg-gradient-to-br from-orange-950/40 via-slate-900/80 to-slate-950 border border-orange-500/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-orange-400 transition shadow-xl hover:shadow-orange-500/10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-300">Failed Jobs</span>
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2 relative z-10">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {stats ? stats.totalFailed : 0}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              SMTP Errors
            </span>
          </div>
        </div>
      </div>

      {/* BullMQ Live Status Ticker */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40">
            <Zap className="h-4 w-4 fill-orange-400/20 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">BullMQ Redis Queue Telemetry</span>
            <span className="text-[11px] text-slate-400 ml-2 font-medium">Real-time Worker Concurrency State</span>
          </div>
        </div>

        <div className="flex items-center space-x-5 font-mono text-xs">
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl text-emerald-300">
            <span className="text-slate-400 font-sans font-medium">Waiting:</span>
            <span className="font-bold text-sm">{stats?.queue?.waiting || 0}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-amber-300">
            <span className="text-slate-400 font-sans font-medium">Delayed:</span>
            <span className="font-bold text-sm">{stats?.queue?.delayed || 0}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-xl text-orange-300">
            <span className="text-slate-400 font-sans font-medium">Active:</span>
            <span className="font-bold text-sm">{stats?.queue?.active || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
