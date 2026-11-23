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
import { useState, useEffect, useMemo } from 'react';
import type { PerformanceDay } from '@/lib/api';
import { useTheme } from '@/components/theme/ThemeProvider';

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

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="theme-card border rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold theme-text-primary mb-2">{formatShortDate(label ?? '')}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="theme-text-secondary capitalize">{entry.name}:</span>
          <span className="font-semibold theme-text-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CampaignChart({
  data,
  days = 14,
  onDaysChange,
  loading = false,
  error = null,
  onRetry,
}: CampaignChartProps) {
  const { theme } = useTheme();
  const chartColors = useMemo(
    () =>
      theme === 'light'
        ? { grid: '#E2E8F0', tick: '#64748B' }
        : { grid: '#1E293B', tick: '#64748B' },
    [theme]
  );

  const allZeros = data.length > 0 && data.every((d) => d.sent === 0);
  const isEmpty = data.length === 0 || allZeros;
  const windowWidth = useWindowWidth();
  const chartHeight = windowWidth < 640 ? 160 : 220;
  const tickInterval =
    windowWidth < 640
      ? Math.max(Math.ceil(data.length / 4) - 1, 1)
      : windowWidth < 768
        ? Math.max(Math.ceil(data.length / 6) - 1, 0)
        : 0;

  return (
    <div className="theme-card rounded-2xl border p-4 md:p-5 h-full flex flex-col justify-between min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-4 md:mb-5">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <h2 className="text-base font-semibold theme-text-primary">Campaign Performance</h2>
          {onDaysChange && (
            <div className="flex items-center theme-inset border theme-border rounded-lg p-0.5 text-xs font-medium">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    days === d
                      ? 'bg-accent text-white shadow-sm font-semibold'
                      : 'theme-text-secondary hover:theme-text-primary'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>

        {!isEmpty && !loading && !error && (
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs theme-text-secondary">
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

      {loading ? (
        <div className="flex flex-col items-center justify-center" style={{ height: chartHeight }}>
          <div className="w-full h-full theme-skeleton rounded-xl animate-pulse flex items-center justify-center text-xs theme-text-secondary">
            Loading performance data...
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center theme-text-secondary gap-2" style={{ height: chartHeight }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium theme-text-primary">Failed to load performance data</p>
          <p className="text-xs theme-text-muted">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-1 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center theme-text-secondary" style={{ height: chartHeight }}>
          <div className="w-12 h-12 rounded-full theme-inset border theme-border flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold theme-text-primary">No campaign data yet</p>
          <p className="text-xs theme-text-muted mt-1 text-center">Your campaign performance will appear here once you start sending emails.</p>
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
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 11, fill: chartColors.tick }}
              axisLine={false}
              tickLine={false}
              dy={8}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: chartColors.tick }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} />
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