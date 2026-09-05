'use client';

import React from 'react';
import { EmailJob } from '../types';
import { CheckCircle2, AlertTriangle, ExternalLink, Mail, Calendar, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

interface SentTableProps {
  jobs: EmailJob[];
  loading: boolean;
  onOpenCompose: () => void;
}

export function SentTable({ jobs, loading, onOpenCompose }: SentTableProps) {
  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading sent email history...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-white">No Sent Emails Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Emails will appear here automatically once the BullMQ queue processes them.
        </p>
        <button
          onClick={onOpenCompose}
          className="mt-5 inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Mail className="h-4 w-4" />
          <span>Send Your First Batch</span>
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
              <th className="py-3.5 px-4">Sent Time</th>
              <th className="py-3.5 px-4">Sender</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Ethereal Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {jobs.map((job) => {
              const isSent = job.status === 'SENT';
              const sentDate = job.sentAt ? new Date(job.sentAt) : new Date(job.updatedAt);

              return (
                <tr key={job.id} className="hover:bg-slate-800/30 transition group">
                  {/* Recipient */}
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div className="flex items-center space-x-2">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
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

                  {/* Sent Time */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{format(sentDate, 'MMM d, h:mm:ss a')}</span>
                    </div>
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
                    {isSent ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Sent</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title={job.error || ''}>
                        <AlertTriangle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                  </td>

                  {/* Ethereal SMTP Link */}
                  <td className="py-3.5 px-4 text-right">
                    {job.etherealPreviewUrl ? (
                      <a
                        href={job.etherealPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 transition"
                      >
                        <span>View Email</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600 text-[11px]">N/A</span>
                    )}
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
