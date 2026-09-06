'use client';

import React, { useState } from 'react';
import { X, MessageSquare, ExternalLink, CheckCircle2, AlertCircle, Send, ShieldAlert } from 'lucide-react';
import { apiService } from '../lib/api';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isSlackConnected: boolean;
  onSuccess: () => void;
}

export function SlackModal({ isOpen, onClose, userId, isSlackConnected, onSuccess }: SlackModalProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channel, setChannel] = useState('email-alerts');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      setLoading(true);
      setMsg(null);
      const res = await apiService.saveSlackWebhook(userId, webhookUrl.trim(), channel.trim());
      setMsg({ type: 'success', text: res.message });
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to save Slack Webhook',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      const url = await apiService.getSlackAuthUrl(userId);
      window.location.href = url;
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Could not generate Slack OAuth redirect' });
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await apiService.disconnectSlack(userId);
      setMsg({ type: 'success', text: 'Slack disconnected successfully' });
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to disconnect' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md">
              <MessageSquare className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Slack Rate Limit Notifications</h2>
              <p className="text-xs text-emerald-300 font-medium">Receive live alerts when hourly send limits are triggered</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {msg && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                msg.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-orange-500/20 border-orange-500/40 text-orange-300'
              }`}
            >
              {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-orange-400" />}
              <span>{msg.text}</span>
            </div>
          )}

          {isSlackConnected ? (
            <div className="space-y-4">
              <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-sm font-extrabold text-white">Slack Notifications Connected!</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Live alerts will automatically post to your Slack channel the moment a rate limit is exceeded.
                </p>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="w-full py-2.5 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-300 text-xs font-bold rounded-xl transition"
              >
                Disconnect Slack
              </button>
            </div>
          ) : (
            <>
              {/* Method 1: Incoming Webhook */}
              <form onSubmit={handleSaveWebhook} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                    Slack Incoming Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/T00/B00/XXX"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition text-[11px]"
                    required
                  />
                  <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                    Provides instant verification without requiring a public Slack App registration.
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">Channel Name</label>
                    <input
                      type="text"
                      placeholder="e.g. #email-alerts"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-400 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Save & Test</span>
                  </button>
                </div>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-500 uppercase">Or</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Method 2: Real Slack OAuth 2.0 */}
              <button
                type="button"
                onClick={handleOAuthConnect}
                className="w-full flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-xs font-extrabold py-3 rounded-2xl transition"
              >
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>Connect via Slack OAuth 2.0 Flow</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
