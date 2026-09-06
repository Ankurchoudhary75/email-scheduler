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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent"></div>
        <p className="text-sm font-semibold text-slate-400">Loading sent email history...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 text-teal-400 mx-auto flex items-center justify-center mb-4 shadow-lg">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white">No Sent Emails Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Emails will appear here automatically once the BullMQ queue processes them.
        </p>
        <button
          onClick={onOpenCompose}
          className="mt-5 inline-flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md"
        >
          <Mail className="h-4 w-4 stroke-[2.5]" />
          <span>Send Your First Batch</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-800 text-teal-300 uppercase tracking-wider font-extrabold text-[11px]">
              <th className="py-4 px-5">Recipient</th>
              <th className="py-4 px-5">Subject</th>
              <th className="py-4 px-5">Sent Time</th>
              <th className="py-4 px-5">Sender</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Ethereal Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {jobs.map((job) => {
              const isSent = job.status === 'SENT';
              const sentDate = job.sentAt ? new Date(job.sentAt) : new Date(job.updatedAt);

              return (
                <tr key={job.id} className="hover:bg-slate-800/40 transition group">
                  {/* Recipient */}
                  <td className="py-4 px-5 font-bold text-white">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`h-8 w-8 rounded-full border flex items-center justify-center font-extrabold text-xs shadow-sm ${
                          isSent
                            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                            : 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                        }`}
                      >
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

                  {/* Sent Time */}
                  <td className="py-4 px-5 text-slate-300 font-semibold">
                    <div className="flex items-center space-x-1.5 text-teal-300">
                      <Calendar className="h-3.5 w-3.5 text-teal-400" />
                      <span>{format(sentDate, 'MMM d, h:mm:ss a')}</span>
                    </div>
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
                    {isSent ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                        <span>Sent</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm"
                        title={job.error || ''}
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                        <span>Failed</span>
                      </span>
                    )}
                  </td>

                  {/* Ethereal SMTP Link */}
                  <td className="py-4 px-5 text-right">
                    {job.etherealPreviewUrl ? (
                      <a
                        href={job.etherealPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 px-3 py-1.5 rounded-xl shadow-md transition transform hover:scale-105"
                      >
                        <span>View Email</span>
                        <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-semibold">N/A</span>
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
