'use client';

import React, { useState } from 'react';
import { X, User as UserIcon, Mail, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: { email: string; name?: string; avatarUrl?: string }) => Promise<void>;
  currentUser: User | null;
}

const PRESET_ACCOUNTS = [
  {
    name: 'Ankur Choudhary',
    email: 'ankur.demo@reachinbox.ai',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    role: 'ReachInbox Admin (Default)',
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@growthops.io',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    role: 'Growth Marketing Lead',
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@outreachscale.co',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    role: 'Sales Operations Manager',
  },
];

export function LoginModal({ isOpen, onClose, onLogin, currentUser }: LoginModalProps) {
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);

  if (!isOpen) return null;

  const handleSelectPreset = async (account: (typeof PRESET_ACCOUNTS)[0], index: number) => {
    setSelectedPreset(index);
    try {
      setLoading(true);
      await onLogin({
        name: account.name,
        email: account.email,
        avatarUrl: account.avatarUrl,
      });
      onClose();
    } catch (err) {
      console.error('Preset login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    try {
      setLoading(true);
      await onLogin({
        name: customName.trim() || customEmail.split('@')[0],
        email: customEmail.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customEmail.trim())}`,
      });
      onClose();
    } catch (err) {
      console.error('Custom login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md">
              <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Google Authentication</h2>
              <p className="text-xs text-amber-400 font-medium">Select or create your user profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preset Google Accounts */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              One-Click Demo Google Accounts
            </label>
            <div className="space-y-2">
              {PRESET_ACCOUNTS.map((acc, idx) => {
                const isActive = currentUser?.email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectPreset(acc, idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-400/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={acc.avatarUrl}
                        alt={acc.name}
                        className="h-9 w-9 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          {acc.name}
                          {isActive && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full border border-amber-500/30">
                              Active
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">{acc.email}</p>
                        <p className="text-[10px] text-emerald-400 font-medium">{acc.role}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <Check className="h-4 w-4 text-amber-400 stroke-[3]" />
                    ) : (
                      <span className="text-xs text-slate-500 group-hover:text-white">&rarr;</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-[11px] font-semibold uppercase">Or Custom Sign In</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Custom Account Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Your Full Name (e.g. Ankur Choudhary)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
            <div>
              <input
                type="email"
                required
                placeholder="Google Email (e.g. ankur@company.com)"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !customEmail.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with Custom Google Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
