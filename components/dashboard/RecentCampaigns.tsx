import Link from 'next/link';
import type { MockCampaign } from '@/lib/mockData';

interface RecentCampaignsProps {
  campaigns: MockCampaign[];
}

const STATUS_STYLES: Record<string, string> = {
  Running: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  Draft: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export default function RecentCampaigns({ campaigns }: RecentCampaignsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Recent Campaigns</h2>
        <Link
          href="/campaigns"
          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-gray-50">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="flex items-center gap-3 py-3 hover:bg-gray-50/70 -mx-2 px-2 rounded-xl transition-colors group cursor-pointer"
          >
            {/* Campaign icon */}
            <div className={`w-9 h-9 rounded-xl ${c.iconColor} flex items-center justify-center shrink-0`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-accent transition-colors">
                {c.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {c.leadsCount} leads &bull; {c.daysAgo} {c.daysAgo === 1 ? 'day' : 'days'} ago
              </p>
            </div>

            {/* Status badge */}
            <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status]}`}>
              {c.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
