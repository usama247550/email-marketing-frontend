// ---------------------------------------------------------------------------
// Mock data for the Dashboard (real DB wiring comes later)
// ---------------------------------------------------------------------------

export const PROJECTS = [
  { id: 'all', name: 'All Projects', slug: 'all' },
  { id: 'arswift', name: 'Arswift', slug: 'arswift' },
  { id: 'goldsilver', name: 'Goldsilver.de', slug: 'goldsilver' },
  { id: 'anticellulite', name: 'Cellulite-Anticellulite', slug: 'anticellulite' },
];

export type ProjectId = 'all' | 'arswift' | 'goldsilver' | 'anticellulite';

export interface StatData {
  totalLeads: number;
  emailsFound: number;
  emailsSent: number;
  emailsOpened: number;
  replies: number;
  totalLeadsChange: number;
  emailsFoundChange: number;
  emailsSentChange: number;
  emailsOpenedChange: number;
  repliesChange: number;
}

export const STATS_BY_PROJECT: Record<ProjectId, StatData> = {
  all: {
    totalLeads: 3210,
    emailsFound: 2490,
    emailsSent: 1840,
    emailsOpened: 920,
    replies: 134,
    totalLeadsChange: 12,
    emailsFoundChange: 8,
    emailsSentChange: 15,
    emailsOpenedChange: 10,
    repliesChange: 5,
  },
  arswift: {
    totalLeads: 1250,
    emailsFound: 840,
    emailsSent: 620,
    emailsOpened: 310,
    replies: 42,
    totalLeadsChange: 12,
    emailsFoundChange: 8,
    emailsSentChange: 15,
    emailsOpenedChange: 9,
    repliesChange: 5,
  },
  goldsilver: {
    totalLeads: 980,
    emailsFound: 760,
    emailsSent: 590,
    emailsOpened: 380,
    replies: 56,
    totalLeadsChange: 7,
    emailsFoundChange: 11,
    emailsSentChange: 9,
    emailsOpenedChange: 14,
    repliesChange: 3,
  },
  anticellulite: {
    totalLeads: 980,
    emailsFound: 890,
    emailsSent: 630,
    emailsOpened: 230,
    replies: 36,
    totalLeadsChange: -3,
    emailsFoundChange: 6,
    emailsSentChange: 4,
    emailsOpenedChange: -2,
    repliesChange: 8,
  },
};

// Chart data — last 10 days
export interface ChartPoint {
  date: string;
  sent: number;
  opened: number;
  replied: number;
}

export const CHART_DATA_BY_PROJECT: Record<ProjectId, ChartPoint[]> = {
  all: [
    { date: 'Sep 16', sent: 120, opened: 60, replied: 18 },
    { date: 'Sep 17', sent: 145, opened: 72, replied: 22 },
    { date: 'Sep 18', sent: 130, opened: 65, replied: 19 },
    { date: 'Sep 19', sent: 160, opened: 88, replied: 27 },
    { date: 'Sep 20', sent: 175, opened: 95, replied: 30 },
    { date: 'Sep 21', sent: 155, opened: 78, replied: 24 },
    { date: 'Sep 22', sent: 190, opened: 105, replied: 35 },
    { date: 'Sep 23', sent: 210, opened: 118, replied: 40 },
    { date: 'Sep 24', sent: 195, opened: 110, replied: 38 },
    { date: 'Sep 25', sent: 225, opened: 130, replied: 45 },
  ],
  arswift: [
    { date: 'Sep 16', sent: 40, opened: 20, replied: 6 },
    { date: 'Sep 17', sent: 55, opened: 28, replied: 8 },
    { date: 'Sep 18', sent: 48, opened: 24, replied: 7 },
    { date: 'Sep 19', sent: 62, opened: 35, replied: 10 },
    { date: 'Sep 20', sent: 70, opened: 38, replied: 12 },
    { date: 'Sep 21', sent: 58, opened: 30, replied: 9 },
    { date: 'Sep 22', sent: 75, opened: 42, replied: 14 },
    { date: 'Sep 23', sent: 85, opened: 48, replied: 16 },
    { date: 'Sep 24', sent: 78, opened: 44, replied: 15 },
    { date: 'Sep 25', sent: 90, opened: 52, replied: 18 },
  ],
  goldsilver: [
    { date: 'Sep 16', sent: 50, opened: 28, replied: 8 },
    { date: 'Sep 17', sent: 58, opened: 32, replied: 10 },
    { date: 'Sep 18', sent: 52, opened: 28, replied: 8 },
    { date: 'Sep 19', sent: 65, opened: 38, replied: 12 },
    { date: 'Sep 20', sent: 72, opened: 42, replied: 13 },
    { date: 'Sep 21', sent: 60, opened: 34, replied: 10 },
    { date: 'Sep 22', sent: 78, opened: 44, replied: 14 },
    { date: 'Sep 23', sent: 88, opened: 50, replied: 18 },
    { date: 'Sep 24', sent: 80, opened: 46, replied: 16 },
    { date: 'Sep 25', sent: 92, opened: 54, replied: 19 },
  ],
  anticellulite: [
    { date: 'Sep 16', sent: 30, opened: 12, replied: 4 },
    { date: 'Sep 17', sent: 32, opened: 12, replied: 4 },
    { date: 'Sep 18', sent: 30, opened: 13, replied: 4 },
    { date: 'Sep 19', sent: 33, opened: 15, replied: 5 },
    { date: 'Sep 20', sent: 33, opened: 15, replied: 5 },
    { date: 'Sep 21', sent: 37, opened: 14, replied: 5 },
    { date: 'Sep 22', sent: 37, opened: 19, replied: 7 },
    { date: 'Sep 23', sent: 37, opened: 20, replied: 6 },
    { date: 'Sep 24', sent: 37, opened: 20, replied: 7 },
    { date: 'Sep 25', sent: 43, opened: 24, replied: 8 },
  ],
};

export type CampaignStatus = 'Running' | 'Completed' | 'Draft';

export interface MockCampaign {
  id: string;
  name: string;
  projectId: ProjectId;
  leadsCount: number;
  daysAgo: number;
  status: CampaignStatus;
  iconColor: string;
}

export const CAMPAIGNS_BY_PROJECT: Record<ProjectId, MockCampaign[]> = {
  all: [
    { id: 'c1', name: 'Frankfurt Wellness', projectId: 'arswift', leadsCount: 200, daysAgo: 2, status: 'Running', iconColor: 'bg-purple-500' },
    { id: 'c2', name: 'Berlin Beauty Centers', projectId: 'goldsilver', leadsCount: 150, daysAgo: 4, status: 'Completed', iconColor: 'bg-red-500' },
    { id: 'c3', name: 'Munich Fitness Studios', projectId: 'anticellulite', leadsCount: 100, daysAgo: 5, status: 'Completed', iconColor: 'bg-green-500' },
    { id: 'c4', name: 'Hamburg Spa Retreat', projectId: 'arswift', leadsCount: 180, daysAgo: 7, status: 'Draft', iconColor: 'bg-blue-500' },
    { id: 'c5', name: 'Cologne Wellness Hub', projectId: 'goldsilver', leadsCount: 220, daysAgo: 9, status: 'Running', iconColor: 'bg-orange-500' },
  ],
  arswift: [
    { id: 'c1', name: 'Frankfurt Wellness', projectId: 'arswift', leadsCount: 200, daysAgo: 2, status: 'Running', iconColor: 'bg-purple-500' },
    { id: 'c4', name: 'Hamburg Spa Retreat', projectId: 'arswift', leadsCount: 180, daysAgo: 7, status: 'Draft', iconColor: 'bg-blue-500' },
    { id: 'c6', name: 'Arswift Q3 Outreach', projectId: 'arswift', leadsCount: 310, daysAgo: 12, status: 'Completed', iconColor: 'bg-teal-500' },
  ],
  goldsilver: [
    { id: 'c2', name: 'Berlin Beauty Centers', projectId: 'goldsilver', leadsCount: 150, daysAgo: 4, status: 'Completed', iconColor: 'bg-red-500' },
    { id: 'c5', name: 'Cologne Wellness Hub', projectId: 'goldsilver', leadsCount: 220, daysAgo: 9, status: 'Running', iconColor: 'bg-orange-500' },
    { id: 'c7', name: 'Gold & Silver Promo', projectId: 'goldsilver', leadsCount: 95, daysAgo: 14, status: 'Draft', iconColor: 'bg-yellow-500' },
  ],
  anticellulite: [
    { id: 'c3', name: 'Munich Fitness Studios', projectId: 'anticellulite', leadsCount: 100, daysAgo: 5, status: 'Completed', iconColor: 'bg-green-500' },
    { id: 'c8', name: 'Anticellulite Launch', projectId: 'anticellulite', leadsCount: 275, daysAgo: 8, status: 'Running', iconColor: 'bg-pink-500' },
    { id: 'c9', name: 'Body Care Clinics', projectId: 'anticellulite', leadsCount: 130, daysAgo: 15, status: 'Completed', iconColor: 'bg-indigo-500' },
  ],
};
