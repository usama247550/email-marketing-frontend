'use client';

import Link from 'next/link';
import type { RecentCampaignItem } from '@/lib/api';

interface RecentCampaignsProps {
  campaigns: RecentCampaignItem[];
  iconColors?: string[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const DEFAULT_ICON_COLORS = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
];

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
  Completed: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
  sending:   'bg-blue-950/60 text-blue-400 border border-blue-800/60 animate-pulse',
  Running:   'bg-blue-950/60 text-blue-400 border border-blue-800/60 animate-pulse',
  draft:     'bg-slate-800 text-slate-300 border border-slate-700',
  Draft:     'bg-slate-800 text-slate-300 border border-slate-700',
  failed:    'bg-rose-950/60 text-rose-400 border border-rose-800/60',
  Failed:    'bg-rose-950/60 text-rose-400 border border-rose-800/60',
};

function formatRelativeOrShortDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentCampaigns({
  campaigns,
  iconColors = DEFAULT_ICON_COLORS,
  loading = false,
  error = null,
  onRetry,
}: RecentCampaignsProps) {
  const isEmpty = campaigns.length === 0;

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-sm p-4 md:p-5 flex flex-col justify-between h-full min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Recent Campaigns</h2>
        <Link
          href="/campaigns"
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 py-1 flex-1 justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 rounded-xl bg-[#182234] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 bg-[#182234] rounded animate-pulse" />
                <div className="h-3 w-48 bg-[#182234] rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-[#182234] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-[#94A3B8] gap-2 flex-1">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-white">Failed to load recent campaigns</p>
          <p className="text-xs text-[#64748B]">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-[#94A3B8] flex-1">
          <div className="w-12 h-12 rounded-full bg-[#182234] border border-[#26354D] flex items-center justify-center mb-3 text-[#94A3B8]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">No campaigns yet</p>
          <p className="text-xs text-[#64748B] mt-1 text-center">
            Create your first campaign to see recent activity here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#1E293B]/50 flex-1">
          {campaigns.map((c, idx) => {
            const iconColor = iconColors[idx % iconColors.length];
            const dateText = formatRelativeOrShortDate(c.sentAt || c.createdAt);

            return (
              <Link
                key={c._id}
                href={`/campaigns/${c._id}`}
                className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 py-3 hover:bg-[#182234]/70 -mx-2 px-2 rounded-xl transition-colors group cursor-pointer min-h-[44px]"
              >
                {/* Campaign icon */}
                <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors" title={c.name}>
                      {c.name}
                    </p>
                    {c.projectName && (
                      <span className="hidden sm:inline-block text-[11px] font-medium text-[#94A3B8] bg-[#182234] border border-[#2E3C54]/60 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[120px]" title={c.projectName}>
                        {c.projectName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5 break-words">
                    {c.sentCount} sent / {c.openedCount} opened ({c.openRate}%) &bull; {dateText}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ml-auto min-h-[28px] flex items-center ${
                    STATUS_STYLES[c.status] ?? STATUS_STYLES.draft
                  }`}
                >
                  {c.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
