'use client';

import React from 'react';
import { EmailJob } from '../types';
import { Clock, ShieldAlert, Trash2, Mail, Calendar, UserCheck, Zap } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ScheduledTableProps {
  jobs: EmailJob[];
  loading: boolean;
  onDelete: (id: string) => void;
  onOpenCompose: () => void;
}

export function ScheduledTable({ jobs, loading, onDelete, onOpenCompose }: ScheduledTableProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent"></div>
        <p className="text-sm font-semibold text-slate-400">Loading scheduled email jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-4 shadow-lg">
          <Clock className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white">No Scheduled Emails</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          You don't have any pending or rate-limited email jobs in the queue.
        </p>
        <button
          onClick={onOpenCompose}
          className="mt-5 inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md"
        >
          <Mail className="h-4 w-4 stroke-[2.5]" />
          <span>Schedule Campaign</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-800 text-amber-300 uppercase tracking-wider font-extrabold text-[11px]">
              <th className="py-4 px-5">Recipient</th>
              <th className="py-4 px-5">Subject</th>
              <th className="py-4 px-5">Scheduled Time</th>
              <th className="py-4 px-5">Sender</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {jobs.map((job) => {
              const scheduledDate = new Date(job.scheduledAt);
              const isRateLimited = job.status === 'RATE_LIMITED';

              return (
                <tr key={job.id} className="hover:bg-slate-800/40 transition group">
                  {/* Recipient */}
                  <td className="py-4 px-5 font-bold text-white">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-extrabold text-xs shadow-sm">
                        {job.recipient.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[180px] font-semibold text-slate-100" title={job.recipient}>
                        {job.recipient}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="py-4 px-5 text-slate-200">
                    <p className="font-bold text-slate-100 truncate max-w-[220px]" title={job.subject}>
                      {job.subject}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[220px] font-medium mt-0.5">
                      {job.body.slice(0, 50)}...
                    </p>
                  </td>

                  {/* Scheduled Time */}
                  <td className="py-4 px-5 text-slate-300">
                    <div className="flex items-center space-x-1.5 font-semibold text-emerald-300">
                      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{format(scheduledDate, 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {formatDistanceToNow(scheduledDate, { addSuffix: true })}
                    </p>
                  </td>

                  {/* Sender */}
                  <td className="py-4 px-5 text-slate-300">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                      <span className="truncate max-w-[130px]" title={job.sender?.email || 'Default'}>
                        {job.sender?.name || job.sender?.email || 'Default Sender'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">
                    {isRateLimited ? (
                      <span
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm"
                        title={job.error || ''}
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                        <span>Rate Limited</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Scheduled</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => onDelete(job.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Cancel Job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
