'use client';

import React from 'react';
import { Search, RefreshCw, Sparkles, Filter } from 'lucide-react';

interface SearchBarAndTabsProps {
  activeTab: 'all' | 'scheduled' | 'sent' | 'failed' | 'rate_limited';
  onTabChange: (tab: 'all' | 'scheduled' | 'sent' | 'failed' | 'rate_limited') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  searchSource?: string;
}

export function SearchBarAndTabs({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  searchSource,
}: SearchBarAndTabsProps) {
  const tabs: { id: 'all' | 'scheduled' | 'sent' | 'failed' | 'rate_limited'; label: string }[] = [
    { id: 'all', label: 'All Jobs' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'sent', label: 'Sent' },
    { id: 'rate_limited', label: 'Rate Limited' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input + Elasticsearch Indicator + Refresh */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search emails via Elasticsearch..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchSource === 'elasticsearch' && (
            <span
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
              title="Powered by Elasticsearch Index"
            />
          )}
        </div>

        <button
          onClick={onRefresh}
          className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
