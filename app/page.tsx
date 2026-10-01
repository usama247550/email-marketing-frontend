'use client';

import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import StatsCard from '@/components/dashboard/StatsCard';
import CampaignChart from '@/components/dashboard/CampaignChart';
import RecentCampaigns from '@/components/dashboard/RecentCampaigns';
import { STAT_CHANGES_BY_PROJECT, CAMPAIGN_ICON_COLORS } from '@/lib/mockData';
import { fetchDashboardStats } from '@/lib/api';
import type { ApiStats, ApiCampaign } from '@/lib/api';

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Fallback stats shown while loading or when backend is unreachable
const EMPTY_STATS: ApiStats = {
  totalLeads: 0,
  emailsFound: 0,
  emailsSent: 0,
  emailsOpened: 0,
  replies: 0,
};

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [stats, setStats] = useState<ApiStats>(EMPTY_STATS);
  const [recentCampaigns, setRecentCampaigns] = useState<ApiCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (project: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats(project);
      setStats(data.stats);
      setRecentCampaigns(data.recentCampaigns);
    } catch (err: any) {
      console.error('[Dashboard] API error:', err);
      setError(err.message ?? 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(selectedProject);
  }, [selectedProject, loadDashboard]);

  // Use fallback mock changes for now - TODO: get these from backend when trend data is implemented
  const changes = STAT_CHANGES_BY_PROJECT['all'] || {
    totalLeadsChange: 0,
    emailsFoundChange: 0,
    emailsSentChange: 0,
    emailsOpenedChange: 0,
    repliesChange: 0,
  };

  const statCards = [
    { 
      title: 'Total Leads', 
      value: stats.totalLeads, 
      change: changes.totalLeadsChange,
      // Note: Currently shows total across all projects since Lead/Batch models don't have project linking
      note: selectedProject !== 'all' ? 'Total across all projects (project filtering not yet implemented)' : undefined
    },
    { 
      title: 'Emails Found', 
      value: stats.emailsFound, 
      change: changes.emailsFoundChange,
      note: selectedProject !== 'all' ? 'Total across all projects (project filtering not yet implemented)' : undefined
    },
    { 
      title: 'Emails Sent', 
      value: stats.emailsSent, 
      change: changes.emailsSentChange,
      note: 'Email sending not yet implemented'
    },
    { 
      title: 'Emails Opened', 
      value: stats.emailsOpened, 
      change: changes.emailsOpenedChange,
      note: 'Email tracking not yet implemented'
    },
    { 
      title: 'Replies', 
      value: stats.replies, 
      change: changes.repliesChange,
      note: 'Reply tracking not yet implemented'
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      {/* Top bar */}
      <Topbar
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
      />

      {/* Page content */}
      <div className="flex-1 px-7 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Welcome heading */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Welcome back, Ali
              <span className="text-2xl">👋</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Here&apos;s what&apos;s happening with your email marketing.
            </p>
          </div>
          <span className="text-sm text-gray-400 font-medium hidden md:block">{getTodayString()}</span>
        </div>

        {/* Error banner — only shown if backend is down */}
        {error && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Backend unreachable — showing cached data. <span className="font-medium">{error}</span></span>
            <button onClick={() => loadDashboard(selectedProject)} className="ml-auto text-xs font-semibold underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Stats cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              loading={loading}
            />
          ))}
        </div>

        {/* Chart + Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <CampaignChart data={[]} showEmptyState={true} />
          </div>
          <div className="lg:col-span-2">
            <RecentCampaigns
              campaigns={recentCampaigns}
              iconColors={CAMPAIGN_ICON_COLORS}
              loading={loading}
              showEmptyState={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
