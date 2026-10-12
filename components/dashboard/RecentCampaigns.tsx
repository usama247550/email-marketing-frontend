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
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  sending:   'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse',
  Running:   'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse',
  draft:     'bg-gray-100 text-gray-600 border border-gray-200',
  Draft:     'bg-gray-100 text-gray-600 border border-gray-200',
  failed:    'bg-rose-50 text-rose-700 border border-rose-200',
  Failed:    'bg-rose-50 text-rose-700 border border-rose-200',
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Recent Campaigns</h2>
        <Link
          href="/campaigns"
          className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 py-1 flex-1 justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2 flex-1">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-gray-700">Failed to load recent campaigns</p>
          <p className="text-xs text-gray-400">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 px-3 py-1.5 text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400 flex-1">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-gray-300">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <p className="text-sm font-medium text-gray-600">No campaigns yet</p>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Create your first campaign to start<br />your email marketing journey
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50 flex-1">
          {campaigns.map((c, idx) => {
            const iconColor = iconColors[idx % iconColors.length];
            const dateText = formatRelativeOrShortDate(c.sentAt || c.createdAt);

            return (
              <Link
                key={c._id}
                href={`/campaigns/${c._id}`}
                className="flex items-center gap-3 py-3 hover:bg-gray-50/70 -mx-2 px-2 rounded-xl transition-colors group cursor-pointer"
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
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-accent transition-colors">
                      {c.name}
                    </p>
                    {c.projectName && (
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[100px]">
                        {c.projectName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.sentCount} sent / {c.openedCount} opened ({c.openRate}%) &bull; {dateText}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${
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
