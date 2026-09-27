// ---------------------------------------------------------------------------
// API client — all fetch() calls to the Express backend live here
// ---------------------------------------------------------------------------

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

// ── Types matching backend responses ─────────────────────────────────────────

export interface ApiStats {
  totalLeads: number;
  emailsFound: number;
  emailsSent: number;
  emailsOpened: number;
  replies: number;
}

export type CampaignStatus = 'Running' | 'Completed' | 'Draft';

export interface ApiCampaign {
  _id: string;
  name: string;
  projectId: { _id: string; name: string; slug: string } | string;
  leadsCount: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  failedCount: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStatsResponse {
  stats: ApiStats;
  recentCampaigns: ApiCampaign[];
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

export async function fetchDashboardStats(project: string): Promise<DashboardStatsResponse> {
  const url = `${API_BASE}/api/dashboard-stats?project=${encodeURIComponent(project)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch dashboard stats: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Unknown API error');
  return json.data as DashboardStatsResponse;
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/api/projects`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetchCampaigns(project?: string) {
  const qs = project && project !== 'all' ? `?project=${encodeURIComponent(project)}` : '';
  const res = await fetch(`${API_BASE}/api/campaigns${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.status}`);
  const json = await res.json();
  return json.data as ApiCampaign[];
}
