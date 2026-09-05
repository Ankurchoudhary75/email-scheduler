'use client';

import React from 'react';
import { EmailJob } from '../types';
import { Clock, ShieldAlert, Trash2, Mail, Calendar, UserCheck } from 'lucide-react';
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading scheduled email jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Scheduled Emails</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          You don't have any pending or rate-limited email jobs in the queue.
        </p>
        <button
          onClick={onOpenCompose}
          className="mt-5 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Mail className="h-4 w-4" />
          <span>Schedule Campaign</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
              <th className="py-3.5 px-4">Recipient</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Scheduled Time</th>
              <th className="py-3.5 px-4">Sender</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {jobs.map((job) => {
              const scheduledDate = new Date(job.scheduledAt);
              const isRateLimited = job.status === 'RATE_LIMITED';

              return (
                <tr key={job.id} className="hover:bg-slate-800/30 transition group">
                  {/* Recipient */}
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div className="flex items-center space-x-2">
                      <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs">
                        {job.recipient.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[180px]" title={job.recipient}>
                        {job.recipient}
                      </span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="py-3.5 px-4 text-slate-200">
                    <p className="font-semibold text-slate-200 truncate max-w-[220px]" title={job.subject}>
                      {job.subject}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                      {job.body.slice(0, 50)}...
                    </p>
                  </td>

                  {/* Scheduled Time */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{format(scheduledDate, 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatDistanceToNow(scheduledDate, { addSuffix: true })}
                    </p>
                  </td>

                  {/* Sender */}
                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-slate-500" />
                      <span className="truncate max-w-[130px]" title={job.sender?.email || 'Default'}>
                        {job.sender?.name || job.sender?.email || 'Default Sender'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {isRateLimited ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title={job.error || ''}>
                        <ShieldAlert className="h-3 w-3" />
                        <span>Rate Limited</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Clock className="h-3 w-3" />
                        <span>Scheduled</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onDelete(job.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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
