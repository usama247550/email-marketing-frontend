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
  sendingMethod: 'smtp' | 'brevo_api';
  emailApiAccountId?: string;
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

// ── Email API Account functions ──────────────────────────────────────────────

export interface EmailApiAccount {
  _id: string;
  name: string;
  provider: 'brevo';
  apiKey: string;
  createdAt: string;
}

export async function getEmailApiAccounts(): Promise<EmailApiAccount[]> {
  try {
    const res = await fetch(`${API_BASE}/api/email-api-accounts`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch email API accounts: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch email API accounts');
    return json.data;
  } catch (error) {
    console.error('Error fetching email API accounts:', error);
    throw error;
  }
}

export async function getEmailApiAccount(id: string): Promise<EmailApiAccount> {
  try {
    const res = await fetch(`${API_BASE}/api/email-api-accounts/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch email API account: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch email API account');
    return json.data;
  } catch (error) {
    console.error('Error fetching email API account:', error);
    throw error;
  }
}

export async function createEmailApiAccount(data: Partial<EmailApiAccount>): Promise<EmailApiAccount> {
  try {
    const res = await fetch(`${API_BASE}/api/email-api-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create email API account: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create email API account');
    return json.data;
  } catch (error) {
    console.error('Error creating email API account:', error);
    throw error;
  }
}

export async function updateEmailApiAccount(id: string, data: Partial<EmailApiAccount>): Promise<EmailApiAccount> {
  try {
    const res = await fetch(`${API_BASE}/api/email-api-accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update email API account: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update email API account');
    return json.data;
  } catch (error) {
    console.error('Error updating email API account:', error);
    throw error;
  }
}

export async function deleteEmailApiAccount(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/email-api-accounts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete email API account: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete email API account');
  } catch (error) {
    console.error('Error deleting email API account:', error);
    throw error;
  }
}

// ── Automation API functions ──────────────────────────────────────────────────

export interface ApiAutomation {
  _id: string;
  name: string;
  // null when the referenced Project/Template has been deleted
  projectId: { _id: string; name: string; senderEmail: string } | string | null;
  templateId: { _id: string; name: string; subject: string } | string | null;
  dailyLimit: number;
  scheduledTime: string; // "HH:mm"
  status: 'active' | 'paused';
  lastRunAt: string | null;
  lastRunSentCount: number;
  createdAt: string;
}

export async function getAutomations(): Promise<ApiAutomation[]> {
  try {
    const res = await fetch(`${API_BASE}/api/automations`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch automations: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch automations');
    return json.data as ApiAutomation[];
  } catch (error) {
    console.error('Error fetching automations:', error);
    throw error;
  }
}

export interface CreateAutomationPayload {
  name: string;
  projectId: string;
  templateId: string;
  dailyLimit: number;
  scheduledTime: string;
  status?: 'active' | 'paused';
}

export async function createAutomation(data: CreateAutomationPayload): Promise<ApiAutomation> {
  try {
    const res = await fetch(`${API_BASE}/api/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create automation: ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create automation');
    return json.data as ApiAutomation;
  } catch (error) {
    console.error('Error creating automation:', error);
    throw error;
  }
}

export async function updateAutomation(
  id: string,
  data: Partial<CreateAutomationPayload> & { status?: 'active' | 'paused' }
): Promise<ApiAutomation> {
  try {
    const res = await fetch(`${API_BASE}/api/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update automation: ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update automation');
    return json.data as ApiAutomation;
  } catch (error) {
    console.error('Error updating automation:', error);
    throw error;
  }
}

export async function deleteAutomation(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/automations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to delete automation: ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete automation');
  } catch (error) {
    console.error('Error deleting automation:', error);
    throw error;
  }
}

// ── Lead Finder API functions ─────────────────────────────────────────────────

export interface MultiNicheSearchPayload {
  projectId:  string;
  country:    string;
  city:       string;   // empty string = search entire country (All Cities mode)
  niches:     string[];
  totalLeads: number;
}

export interface NicheBreakdown {
  niche:         string;
  validFound:    number;   // valid leads with email
  totalChecked:  number;   // total businesses checked from TomTom
  skipped?:      boolean;  // niche was skipped because rate limit hit earlier
  stoppedEarly?: 'cap_hit' | 'rate_limit';
}

export interface MultiNicheSearchResult {
  batchId:           string;
  totalFound:        number;  // valid leads saved
  validCount:        number;
  checkedCount:      number;  // total businesses checked across all niches
  tomtomCallCount:   number;  // total TomTom API calls made this run
  stopReason:        'rate_limit' | 'cap_hit' | null;  // null = completed normally
  perNicheBreakdown: NicheBreakdown[];
}

export interface LeadFinderJobProgress {
  checked:      number;   // total businesses checked so far (across all niches)
  validFound:   number;   // valid emails found so far
  target:       number;   // total valid leads requested
  currentNiche: string;   // niche currently being processed
}

export interface LeadFinderJobStatus {
  status:     'running' | 'done' | 'error';
  startedAt:  string;
  finishedAt: string | null;
  params:     MultiNicheSearchPayload;
  progress:   LeadFinderJobProgress;  // always present — live counts while running
  result?:    MultiNicheSearchResult;
  error?:     string;
}

/**
 * POST /api/lead-finder/multi-niche-search
 * Starts the search job and returns the jobId immediately (HTTP 202).
 */
export async function triggerMultiNicheSearch(
  payload: MultiNicheSearchPayload,
): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/api/lead-finder/multi-niche-search`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.details ? err.details.join(' ') : err.error || `Request failed: ${res.status}`,
    );
  }
  return res.json();
}

/**
 * GET /api/lead-finder/status/:jobId
 * Returns the current status of a running or finished job.
 * Works for both multi-niche and smart search jobs.
 */
export async function pollLeadFinderJob(jobId: string): Promise<LeadFinderJobStatus> {
  const res = await fetch(`${API_BASE}/api/lead-finder/status/${encodeURIComponent(jobId)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Status check failed: ${res.status}`);
  }
  return res.json();
}

// ── Smart Search API functions ────────────────────────────────────────────────

export interface SmartSearchParsedParams {
  country:    string;
  city:       string | null;
  niche:      string;
  criteria:   string | null;
  leadsCount: number;
  nicheTerms?: string[];
  cities?:     string[];
}

export interface SmartSearchLead {
  company: string;
  city:    string;
  website: string;
  email:   string;
  niche:   string;
  score:   number;  // 0-100 quality score from AI
  reason:  string;
}

export interface RejectedLead {
  company: string;
  city:    string;
  website: string;
  email:   string;
  niche:   string;
  score:   number;
  reason:  string;
  signals: {
    hasSSL?:            boolean | null;
    sslError?:          boolean;
    hasMobileViewport?: boolean | null;
    copyrightYear?:     number | null;
    doctype?:           string | null;
    jqueryVersion?:     string | null;
    usesTableLayout?:   boolean | null;
    hasDeprecatedTags?: boolean | null;
    hasMediaQueries?:   boolean | null;
  };
  fetchError?: { code: string; message: string } | null;
}

export interface SmartSearchSummary {
  candidatesFound:    number;
  homepagesChecked:   number;
  passedPrefilter:    number;
  withEmail:          number;
  matched:            number;
  rejected?:          number;
  threshold?:         number;
  fetchErrorCounts?:  Record<string, number>;
  tomtomCallCount:    number;
  stoppedEarlyReason: string | null;
  totalElapsedSec?:   number;
}

export interface SmartSearchProgress {
  stage:             string;
  detail:            string;
  total?:            number;
  homepagesChecked?: number;
  passedPrefilter?:  number;
  withEmail?:        number;
  candidatesFound?:  number;
}

export interface SmartJobStatus {
  type:         'smart';
  status:       'running' | 'done' | 'error';
  stage:        string;
  startedAt:    string;
  finishedAt:   string | null;
  params:       { projectId: string; instructionText: string; leadsCount: number; strictness: string };
  parsedParams: SmartSearchParsedParams | null;
  progress:     SmartSearchProgress;
  results?:     SmartSearchLead[];   // present while running too (partial)
  rejected?:    RejectedLead[];      // present only when done
  summary?:     SmartSearchSummary;
  error?:       string;
  saved?:       boolean;
}

/**
 * POST /api/lead-finder/smart-search
 * Starts a smart search job, returns { jobId } immediately (HTTP 202).
 */
export async function startSmartSearch(payload: {
  projectId:       string;
  instructionText: string;
  leadsCount:      number;
  strictness:      string;
}): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/api/lead-finder/smart-search`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.details ? err.details.join(' ') : err.error || `Request failed: ${res.status}`,
    );
  }
  return res.json();
}

/**
 * GET /api/lead-finder/status/:jobId  (smart-search variant)
 * Same endpoint, typed for the smart job response shape.
 */
export async function getSmartSearchStatus(jobId: string): Promise<SmartJobStatus> {
  const res = await fetch(`${API_BASE}/api/lead-finder/status/${encodeURIComponent(jobId)}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Status check failed: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/lead-finder/smart-search/:jobId/save
 * Saves selected leads from a completed smart search job to a new Batch.
 */
export async function saveSmartSearch(
  jobId: string,
  selectedEmails: string[],
): Promise<{ success: boolean; batchId: string; batchName: string; savedCount: number }> {
  const res = await fetch(`${API_BASE}/api/lead-finder/smart-search/${encodeURIComponent(jobId)}/save`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ selectedEmails }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Save failed: ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/lead-finder/smart-search/:jobId/stop
 * Requests a graceful stop; pipeline finishes current batch and completes with partial results.
 */
export async function stopSmartSearch(jobId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/lead-finder/smart-search/${encodeURIComponent(jobId)}/stop`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Stop failed: ${res.status}`);
  }
  return res.json();
}
