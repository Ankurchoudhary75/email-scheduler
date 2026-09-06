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
  const tabs: { id: 'all' | 'scheduled' | 'sent' | 'failed' | 'rate_limited'; label: string; color: string }[] = [
    { id: 'all', label: 'All Jobs', color: 'from-amber-500 via-orange-500 to-emerald-500' },
    { id: 'scheduled', label: 'Scheduled', color: 'from-emerald-500 to-teal-500' },
    { id: 'sent', label: 'Sent', color: 'from-teal-500 to-emerald-400' },
    { id: 'rate_limited', label: 'Rate Limited', color: 'from-amber-500 to-yellow-400' },
    { id: 'failed', label: 'Failed', color: 'from-orange-500 to-rose-500' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2">
      {/* Tabs */}
      <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto shadow-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition transform active:scale-95 ${
                isActive
                  ? `bg-gradient-to-r ${tab.color} text-slate-950 shadow-md`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input + Elasticsearch Indicator + Refresh */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
          <input
            type="text"
            placeholder="Search emails via Elasticsearch engine..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/90 border border-amber-500/30 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition shadow-inner"
          />
          {searchSource === 'elasticsearch' && (
            <span
              className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"
              title="Indexed via Elasticsearch Engine"
            />
          )}
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 hover:text-white rounded-2xl transition shadow-sm active:scale-95"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
