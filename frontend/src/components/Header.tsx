'use client';

import React from 'react';
import { User } from '../types';
import { Mail, Plus, ExternalLink, LogOut, ShieldAlert, CheckCircle2, User as UserIcon, Zap, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenCompose: () => void;
  onOpenSlackModal: () => void;
}

export function Header({ user, onLogin, onLogout, onOpenCompose, onOpenSlackModal }: HeaderProps) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 p-0.5 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition transform">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-400 fill-amber-400/20 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Reach<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400">Inbox</span>
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                Scheduler v2.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block">
              Distributed BullMQ + Ethereal Engine
            </p>
          </div>
        </div>

        {/* Actions & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* BullBoard Queue Link */}
          <a
            href="http://localhost:4000/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-slate-900/90 border border-amber-500/30 px-3.5 py-2 rounded-xl hover:border-amber-400 hover:bg-amber-500/10 transition shadow-sm"
            title="Open Live BullMQ Dashboard"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>BullMQ Live</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>

          {/* Slack Connection Button */}
          {user && (
            <button
              onClick={onOpenSlackModal}
              className={`flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition shadow-sm ${
                user.slackConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 glow-emerald'
                  : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 border-amber-500/40 hover:border-orange-400 hover:text-orange-200'
              }`}
            >
              {user.slackConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Slack Connected</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  <span>Connect Slack</span>
                </>
              )}
            </button>
          )}

          {/* Compose New Email Button */}
          {user && (
            <button
              onClick={onOpenCompose}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Compose Email</span>
            </button>
          )}

          {/* User Info / Login */}
          {user ? (
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-3 sm:pl-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full border-2 border-amber-400/60 object-cover shadow-sm"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <p className="text-[11px] font-medium text-emerald-400 leading-tight">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md"
            >
              <UserIcon className="h-4 w-4" />
              <span>Google Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
