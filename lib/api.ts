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
  const qs = project && project !== 'all' ? `?project=${encodeURIComponent(project)}` : '';
  const url = `${API_BASE}/api/dashboard/stats${qs}`;
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

// ── Project API functions ─────────────────────────────────────────────────────

export interface Project {
  _id: string;
  name: string;
  senderEmail: string;
  senderName?: string;
  niche?: string;
  websiteUrl?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPassword?: string;
  createdAt: string;
}

export async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE}/api/projects`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch projects');
    return json.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function getProject(id: string): Promise<Project> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch project');
    return json.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  try {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create project');
    return json.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update project');
    return json.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete project');
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ── Template API functions ─────────────────────────────────────────────────────

export interface Template {
  _id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getTemplates(): Promise<Template[]> {
  try {
    const res = await fetch(`${API_BASE}/api/templates`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch templates: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch templates');
    return json.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

export async function getTemplate(id: string): Promise<Template> {
  try {
    const res = await fetch(`${API_BASE}/api/templates/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch template');
    return json.data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}

export async function createTemplate(data: Partial<Template>): Promise<Template> {
  try {
    const res = await fetch(`${API_BASE}/api/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create template: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create template');
    return json.data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<Template> {
  try {
    const res = await fetch(`${API_BASE}/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update template: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update template');
    return json.data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/templates/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete template: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete template');
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// ── Batch and Lead API functions ──────────────────────────────────────────────

export interface Lead {
  _id: string;
  batchId: string;
  company: string;
  city: string;
  website: string;
  email: string;
  status: 'Valid' | 'Invalid';
  createdAt: string;
}

export interface Batch {
  _id: string;
  name: string;
  source: 'CSV Import' | 'Lead Finder Agent';
  leadCount: number;
  projectId?: { _id: string; name: string } | string;
  createdAt: string;
}

export interface BatchesResponse {
  batches: Batch[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface LeadsResponse {
  leads: Lead[];
  batch: Batch;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ImportCsvResponse {
  message: string;
  batch: Batch;
  leadsImported: number;
  validLeads: number;
  invalidLeads: number;
}

export async function getBatches(page: number = 1, limit: number = 15): Promise<BatchesResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/batches?page=${page}&limit=${limit}`, { 
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error(`Failed to fetch batches: ${res.status}`);
    const json = await res.json();
    return json as BatchesResponse;
  } catch (error) {
    console.error('Error fetching batches:', error);
    throw error;
  }
}

export async function getBatchLeads(batchId: string, page: number = 1, limit: number = 15): Promise<LeadsResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/leads/batch/${batchId}?page=${page}&limit=${limit}`, { 
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error(`Failed to fetch batch leads: ${res.status}`);
    const json = await res.json();
    return json as LeadsResponse;
  } catch (error) {
    console.error('Error fetching batch leads:', error);
    throw error;
  }
}

export async function deleteBatch(batchId: string): Promise<{ message: string; deletedBatch: Batch; deletedLeadsCount: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/batches/${batchId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete batch: ${res.status}`);
    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error deleting batch:', error);
    throw error;
  }
}

export async function importCsv(file: File): Promise<ImportCsvResponse> {
  try {
    const formData = new FormData();
    formData.append('csvFile', file);

    const res = await fetch(`${API_BASE}/api/batches/import-csv`, {
      method: 'POST',
      body: formData, // Don't set Content-Type header for multipart/form-data
    });
    
    if (!res.ok) throw new Error(`Failed to import CSV: ${res.status}`);
    const json = await res.json();
    return json as ImportCsvResponse;
  } catch (error) {
    console.error('Error importing CSV:', error);
    throw error;
  }
}
