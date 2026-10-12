'use client';

import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import StatsCard from '@/components/dashboard/StatsCard';
import CampaignChart from '@/components/dashboard/CampaignChart';
import RecentCampaigns from '@/components/dashboard/RecentCampaigns';
import { STAT_CHANGES_BY_PROJECT, CAMPAIGN_ICON_COLORS } from '@/lib/mockData';
import {
  fetchDashboardStats,
  getDashboardPerformance,
  getRecentCampaigns,
} from '@/lib/api';
import type {
  ApiStats,
  PerformanceDay,
  RecentCampaignItem,
} from '@/lib/api';

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
  const [performanceDays, setPerformanceDays] = useState<number>(14);

  // Top stats
  const [stats, setStats] = useState<ApiStats>(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Performance chart
  const [performanceData, setPerformanceData] = useState<PerformanceDay[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  // Recent campaigns
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaignItem[]>([]);
  const [recentCampaignsLoading, setRecentCampaignsLoading] = useState(true);
  const [recentCampaignsError, setRecentCampaignsError] = useState<string | null>(null);

  // Fetch top stats
  const loadStats = useCallback(async (project: string) => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchDashboardStats(project);
      setStats(data.stats);
    } catch (err: any) {
      console.error('[Dashboard] Stats API error:', err);
      setStatsError(err.message ?? 'Failed to load dashboard statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch performance chart data
  const loadPerformance = useCallback(async (project: string, days: number) => {
    setPerformanceLoading(true);
    setPerformanceError(null);
    try {
      const data = await getDashboardPerformance(project, days);
      setPerformanceData(data);
    } catch (err: any) {
      console.error('[Dashboard] Performance API error:', err);
      setPerformanceError(err.message ?? 'Failed to load campaign performance');
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  // Fetch recent campaigns
  const loadRecent = useCallback(async (project: string) => {
    setRecentCampaignsLoading(true);
    setRecentCampaignsError(null);
    try {
      const data = await getRecentCampaigns(project, 5);
      setRecentCampaigns(data);
    } catch (err: any) {
      console.error('[Dashboard] Recent campaigns API error:', err);
      setRecentCampaignsError(err.message ?? 'Failed to load recent campaigns');
    } finally {
      setRecentCampaignsLoading(false);
    }
  }, []);

  // Load everything when selectedProject changes
  useEffect(() => {
    loadStats(selectedProject);
    loadRecent(selectedProject);
  }, [selectedProject, loadStats, loadRecent]);

  // Load performance when selectedProject or performanceDays changes
  useEffect(() => {
    loadPerformance(selectedProject, performanceDays);
  }, [selectedProject, performanceDays, loadPerformance]);

  const handleRetryAll = () => {
    loadStats(selectedProject);
    loadPerformance(selectedProject, performanceDays);
    loadRecent(selectedProject);
  };

  // Fallback mock changes for stat cards
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
    },
    { 
      title: 'Emails Found', 
      value: stats.emailsFound, 
      change: changes.emailsFoundChange,
    },
    { 
      title: 'Emails Sent', 
      value: stats.emailsSent, 
      change: changes.emailsSentChange,
    },
    { 
      title: 'Emails Opened', 
      value: stats.emailsOpened, 
      change: changes.emailsOpenedChange,
    },
    { 
      title: 'Replies', 
      value: stats.replies, 
      change: changes.repliesChange,
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

        {/* Global error banner if stats failed */}
        {statsError && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Backend unreachable — showing cached data. <span className="font-medium">{statsError}</span></span>
            <button onClick={handleRetryAll} className="ml-auto text-xs font-semibold underline hover:no-underline">Retry all</button>
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
              loading={statsLoading}
            />
          ))}
        </div>

        {/* Chart + Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          <div className="lg:col-span-3">
            <CampaignChart
              data={performanceData}
              days={performanceDays}
              onDaysChange={setPerformanceDays}
              loading={performanceLoading}
              error={performanceError}
              onRetry={() => loadPerformance(selectedProject, performanceDays)}
            />
          </div>
          <div className="lg:col-span-2">
            <RecentCampaigns
              campaigns={recentCampaigns}
              iconColors={CAMPAIGN_ICON_COLORS}
              loading={recentCampaignsLoading}
              error={recentCampaignsError}
              onRetry={() => loadRecent(selectedProject)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
