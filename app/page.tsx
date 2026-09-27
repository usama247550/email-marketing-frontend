'use client';

import { useState } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import StatsCard from '@/components/dashboard/StatsCard';
import CampaignChart from '@/components/dashboard/CampaignChart';
import RecentCampaigns from '@/components/dashboard/RecentCampaigns';
import {
  STATS_BY_PROJECT,
  CHART_DATA_BY_PROJECT,
  CAMPAIGNS_BY_PROJECT,
} from '@/lib/mockData';
import type { ProjectId } from '@/lib/mockData';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectId>('all');

  const stats = STATS_BY_PROJECT[selectedProject];
  const chartData = CHART_DATA_BY_PROJECT[selectedProject];
  const campaigns = CAMPAIGNS_BY_PROJECT[selectedProject];

  const statCards = [
    { title: 'Total Leads', value: stats.totalLeads, change: stats.totalLeadsChange },
    { title: 'Emails Found', value: stats.emailsFound, change: stats.emailsFoundChange },
    { title: 'Emails Sent', value: stats.emailsSent, change: stats.emailsSentChange },
    { title: 'Emails Opened', value: stats.emailsOpened, change: stats.emailsOpenedChange },
    { title: 'Replies', value: stats.replies, change: stats.repliesChange },
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

        {/* Stats cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
            />
          ))}
        </div>

        {/* Chart + Recent Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Chart — takes 3/5 */}
          <div className="lg:col-span-3">
            <CampaignChart data={chartData} />
          </div>
          {/* Recent Campaigns — takes 2/5 */}
          <div className="lg:col-span-2">
            <RecentCampaigns campaigns={campaigns} />
          </div>
        </div>
      </div>
    </div>
  );
}
