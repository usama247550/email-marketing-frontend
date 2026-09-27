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

export default function StatsCard({ title, value, change, loading = false }: StatsCardProps) {
  const positive = change >= 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>

      {loading ? (
        <>
          <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-gray-100 rounded-lg animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-gray-900 leading-none">{formatNumber(value)}</p>
          <div className="flex items-center gap-1.5">
            <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {positive ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </span>
            <span className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {positive ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-gray-400">from last run</span>
          </div>
        </>
      )}
    </div>
  );
}
