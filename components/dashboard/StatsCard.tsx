import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  change: number;
  loading?: boolean;
}

function formatNumber(n: number | string): string {
  if (typeof n === 'string') return n;
  return n.toLocaleString('en-US');
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  'Total Leads': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'Emails Found': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  'Emails Sent': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  'Emails Opened': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  'Replies': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
};

export default function StatsCard({ title, value, change, loading = false }: StatsCardProps) {
  const positive = change >= 0;

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-sm px-5 py-4 flex flex-col justify-between gap-3 hover:border-[#2E3C54] hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
          {STAT_ICONS[title] || (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8" />
            </svg>
          )}
        </div>
        <p className="text-xs font-medium text-[#94A3B8] tracking-wide">{title}</p>
      </div>

      {loading ? (
        <>
          <div className="h-8 w-20 bg-[#182234] rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-[#182234] rounded-lg animate-pulse" />
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-3xl font-bold text-white tracking-tight leading-none">
            {formatNumber(value)}
          </p>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`flex items-center font-semibold gap-0.5 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {positive ? (
                  <polyline points="18 15 12 9 6 15" />
                ) : (
                  <polyline points="6 9 12 15 18 9" />
                )}
              </svg>
              <span>{positive ? '+' : ''}{change}%</span>
            </span>
            <span className="text-[#64748B]">from last run</span>
          </div>
        </div>
      )}
    </div>
  );
}
