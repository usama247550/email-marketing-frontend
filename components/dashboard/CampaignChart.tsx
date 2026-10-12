'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useState, useEffect } from 'react';
import type { PerformanceDay } from '@/lib/api';

interface CampaignChartProps {
  data: PerformanceDay[];
  days?: number;
  onDaysChange?: (days: number) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${months[m] || parts[1]} ${d}`;
  }
  return dateStr;
}

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return width;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#182234] border border-[#2E3C54] rounded-xl shadow-2xl px-4 py-3 text-sm">
      <p className="font-semibold text-white mb-2">{formatShortDate(label)}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-[#94A3B8] capitalize">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CampaignChart({
  data,
  days = 14,
  onDaysChange,
  loading = false,
  error = null,
  onRetry,
}: CampaignChartProps) {
  const allZeros = data.length > 0 && data.every((d) => d.sent === 0);
  const isEmpty = data.length === 0 || allZeros;
  const windowWidth = useWindowWidth();
  const chartHeight = windowWidth < 640 ? 160 : 220;
  // On phones show fewer x-axis ticks to avoid overlap
  const tickInterval = windowWidth < 640 ? Math.max(Math.ceil(data.length / 4) - 1, 1) : windowWidth < 768 ? Math.max(Math.ceil(data.length / 6) - 1, 0) : 0;

  return (
    <div className="bg-[#111827] rounded-2xl border border-[#1E293B] shadow-sm p-4 md:p-5 h-full flex flex-col justify-between min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-4 md:mb-5">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <h2 className="text-base font-semibold text-white">Campaign Performance</h2>
          {/* Days selector */}
          {onDaysChange && (
            <div className="flex items-center bg-[#0B0F19] border border-[#1E293B] rounded-lg p-0.5 text-xs font-medium">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    days === d
                      ? 'bg-accent text-white shadow-sm font-semibold'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        {!isEmpty && !loading && !error && (
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              Sent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              Opened
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center" style={{ height: chartHeight }}>
          <div className="w-full h-full bg-[#182234] rounded-xl animate-pulse flex items-center justify-center text-xs text-[#94A3B8]">
            Loading performance data...
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-[#94A3B8] gap-2" style={{ height: chartHeight }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-white">Failed to load performance data</p>
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
        <div className="flex flex-col items-center justify-center text-[#94A3B8]" style={{ height: chartHeight }}>
          <div className="w-12 h-12 rounded-full bg-[#182234] border border-[#26354D] flex items-center justify-center mb-3 text-[#94A3B8]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white">No campaign data yet</p>
          <p className="text-xs text-[#64748B] mt-1 text-center">Your campaign performance will appear here once you start sending emails.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              dy={8}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sent"
              name="Sent"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="url(#sentGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#2563EB' }}
            />
            <Area
              type="monotone"
              dataKey="opened"
              name="Opened"
              stroke="#7C3AED"
              strokeWidth={2.5}
              fill="url(#openedGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#7C3AED' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
