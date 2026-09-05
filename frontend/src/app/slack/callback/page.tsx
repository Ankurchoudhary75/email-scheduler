'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState('Exchanging Slack OAuth authorization code...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setStatus('error');
      setMsg('Missing code or state parameter from Slack OAuth redirect.');
      return;
    }

    api
      .get('/slack/callback', { params: { code, state } })
      .then((res) => {
        if (res.data && res.data.success) {
          setStatus('success');
          setMsg(`Connected to Slack workspace ${res.data.teamName || ''} successfully!`);
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          setStatus('error');
          setMsg(res.data?.error || 'Failed to exchange Slack token.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMsg(err.response?.data?.error || err.message || 'Slack authorization error');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl">
        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
          <MessageSquare className="h-6 w-6" />
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            <p className="text-sm font-semibold text-white">{msg}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h2 className="text-base font-bold text-white">Slack Connected!</h2>
            <p className="text-xs text-slate-300">{msg}</p>
            <p className="text-[11px] text-slate-500">Redirecting back to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
            <h2 className="text-base font-bold text-white">Connection Failed</h2>
            <p className="text-xs text-rose-400">{msg}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SlackCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">Loading callback...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
