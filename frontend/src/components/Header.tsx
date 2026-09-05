'use client';

import React from 'react';
import { User } from '../types';
import { Mail, Plus, ExternalLink, LogOut, ShieldAlert, CheckCircle2, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenCompose: () => void;
  onOpenSlackModal: () => void;
}

export function Header({ user, onLogin, onLogout, onOpenCompose, onOpenSlackModal }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">ReachInbox</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Scheduler
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Distributed Email Job Engine</p>
          </div>
        </div>

        {/* Actions & User Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* BullBoard Queue Link */}
          <a
            href="http://localhost:4000/admin/queues"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition"
            title="Open Live BullMQ Dashboard"
          >
            <span>BullMQ Live</span>
            <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
          </a>

          {/* Slack Connection Button */}
          {user && (
            <button
              onClick={onOpenSlackModal}
              className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                user.slackConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/40 hover:text-amber-400'
              }`}
            >
              {user.slackConnected ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
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
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Compose Email</span>
            </button>
          )}

          {/* User Info / Login */}
          {user ? (
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-3 sm:pl-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-indigo-500/30 object-cover"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-2 bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
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
