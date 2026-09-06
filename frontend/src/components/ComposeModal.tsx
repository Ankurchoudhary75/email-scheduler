'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Sender } from '../types';
import { X, Upload, Mail, Clock, Zap, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (payload: {
    subject: string;
    body: string;
    recipients: string[];
    scheduledAt?: string;
    delayBetweenEmailsSec: number;
    hourlyLimit: number;
    senderId?: string;
  }) => Promise<void>;
  senders: Sender[];
}

export function ComposeModal({ isOpen, onClose, onSchedule, senders }: ComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [delayBetweenEmailsSec, setDelayBetweenEmailsSec] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [fileFileName, setFileFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const extractEmailsFromText = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase())));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRecipientsInput(val);
    const parsed = extractEmailsFromText(val);
    setDetectedEmails(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileFileName(file.name);
    setErrorMsg('');

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (results) => {
          const rawText = JSON.stringify(results.data);
          const parsed = extractEmailsFromText(rawText);
          setDetectedEmails(parsed);
          setRecipientsInput(parsed.join(', '));
        },
        error: (err) => {
          setErrorMsg(`Failed to parse CSV: ${err.message}`);
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = extractEmailsFromText(text);
        setDetectedEmails(parsed);
        setRecipientsInput(parsed.join(', '));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalEmails = detectedEmails.length > 0 ? detectedEmails : extractEmailsFromText(recipientsInput);

    if (!subject.trim()) {
      setErrorMsg('Please enter an email subject.');
      return;
    }
    if (!body.trim()) {
      setErrorMsg('Please enter email body content.');
      return;
    }
    if (finalEmails.length === 0) {
      setErrorMsg('Please provide at least one valid email address or upload a CSV file.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSchedule({
        subject,
        body,
        recipients: finalEmails,
        scheduledAt: scheduledAt || undefined,
        delayBetweenEmailsSec,
        hourlyLimit,
        senderId: selectedSenderId || undefined,
      });

      // Reset form
      setSubject('');
      setBody('');
      setRecipientsInput('');
      setDetectedEmails([]);
      setFileFileName('');
      setScheduledAt('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to schedule campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md">
              <Mail className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Compose New Email Campaign</h2>
              <p className="text-xs text-amber-300 font-medium">Schedule multi-recipient campaigns with provider throttling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-orange-300 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sender Selector */}
          {senders.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">Sending Account</label>
              <select
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition"
              >
                <option value="">Default Ethereal Account (outbound@reachinbox.demo)</option>
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) — Limit: {s.hourlyLimit}/hr
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">Subject Line</label>
            <input
              type="text"
              placeholder="e.g. Quick question regarding ReachInbox Email Job Scheduler"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>

          {/* Body Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">Email Body</label>
            <textarea
              rows={4}
              placeholder="Hi {{name}}, I noticed your recent updates on..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none"
              required
            />
          </div>

          {/* Recipients / File Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Recipients / Leads (CSV / TXT or Manual paste)
              </label>
              {detectedEmails.length > 0 && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{detectedEmails.length} Emails Detected</span>
                </span>
              )}
            </div>

            <div className="space-y-2">
              <textarea
                rows={2}
                placeholder="Paste email addresses separated by commas or lines..."
                value={recipientsInput}
                onChange={handleTextareaChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition resize-none text-[11px]"
              />

              {/* Upload CSV / File Button */}
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-500/40 transition shadow-sm"
                >
                  <Upload className="h-4 w-4 text-amber-400" />
                  <span>{fileFileName ? `Uploaded: ${fileFileName}` : 'Upload CSV / Text Lead List'}</span>
                </button>
                {fileFileName && (
                  <button
                    type="button"
                    onClick={() => {
                      setFileFileName('');
                      setRecipientsInput('');
                      setDetectedEmails([]);
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:underline"
                  >
                    Clear file
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Settings: Start Time, Delay, Hourly Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
            {/* Start Time */}
            <div>
              <label className="block text-[11px] font-bold text-amber-300 mb-1 flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Start Time</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition"
              />
              <span className="text-[10px] text-slate-400">Leave blank for instant send</span>
            </div>

            {/* Delay Between Emails */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-300 mb-1 flex items-center space-x-1">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>Delay Between Sends</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={delayBetweenEmailsSec}
                  onChange={(e) => setDelayBetweenEmailsSec(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 transition"
                />
                <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-500">sec</span>
              </div>
              <span className="text-[10px] text-slate-400">Provider throttling</span>
            </div>

            {/* Hourly Rate Limit */}
            <div>
              <label className="block text-[11px] font-bold text-orange-300 mb-1 flex items-center space-x-1">
                <Shield className="h-3.5 w-3.5 text-orange-400" />
                <span>Hourly Rate Limit</span>
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-orange-400 transition"
              />
              <span className="text-[10px] text-slate-400">Max emails / hr / sender</span>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  <span>Scheduling Jobs...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 stroke-[3]" />
                  <span>Schedule {detectedEmails.length > 0 ? `${detectedEmails.length} Emails` : 'Campaign'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
