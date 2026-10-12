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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{formatShortDate(label)}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500 capitalize">{entry.name}:</span>
          <span className="font-semibold text-gray-800">{entry.value}</span>
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">Campaign Performance</h2>
          {/* Days selector */}
          {onDaysChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDaysChange(d)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    days === d
                      ? 'bg-white text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
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
          <div className="flex items-center gap-4 text-xs text-gray-500">
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
        <div className="flex flex-col items-center justify-center h-[220px]">
          <div className="w-full h-full bg-gray-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
            Loading performance data...
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-gray-500 gap-2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm font-medium text-gray-700">Failed to load performance data</p>
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
        <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2.5 text-gray-300">
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          <p className="text-sm font-medium text-gray-600">No emails sent in the last {days} days</p>
          <p className="text-xs text-gray-400 mt-1">Start sending campaigns to see your email performance metrics</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
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
