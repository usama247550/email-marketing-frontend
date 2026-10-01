'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { ChartPoint } from '@/lib/mockData'; // chart data stays frontend-only (time-series mock)

interface CampaignChartProps {
  data: ChartPoint[];
  showEmptyState?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
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

export default function CampaignChart({ data, showEmptyState = false }: CampaignChartProps) {
  const isEmpty = data.length === 0 || showEmptyState;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">Campaign Performance</h2>
        {!isEmpty && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              Sent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              Opened
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              Replied
            </span>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          <p className="text-sm font-medium">No campaign data yet</p>
          <p className="text-xs text-gray-300 mt-1">Start sending emails to see performance charts</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="repliedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
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
            <Area
              type="monotone"
              dataKey="replied"
              name="Replied"
              stroke="#059669"
              strokeWidth={2.5}
              fill="url(#repliedGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#059669' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
