'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Topbar from '@/components/dashboard/Topbar';
import { 
  getProjects, 
  getBatches, 
  getTemplates,
  type Project,
  type Template,
  type Batch,
  type Lead
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchWithLeads extends Batch {
  validLeadCount: number;
}

interface CampaignRequest {
  name: string;
  projectId: string;
  templateId: string;
  batchIds: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SendingPage() {
  const searchParams = useSearchParams();
  const viewCampaignId = searchParams.get('view'); // Check if we're viewing an existing campaign
  const isViewMode = !!viewCampaignId;
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<BatchWithLeads[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // API data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [batches, setBatches] = useState<BatchWithLeads[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load real data from APIs
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [projectsData, templatesData] = await Promise.all([
          getProjects(),
          getTemplates()
        ]);
        
        setProjects(projectsData);
        setTemplates(templatesData);
        
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load batches when selected project changes
  useEffect(() => {
    if (selectedProject) {
      loadBatches(selectedProject._id);
    } else {
      setBatches([]);
    }
  }, [selectedProject]);

  // Update selected project when projectId changes
  useEffect(() => {
    if (selectedProjectId === 'all') {
      setSelectedProject(null);
    } else {
      const project = projects.find(p => p._id === selectedProjectId);
      setSelectedProject(project || null);
    }
  }, [selectedProjectId, projects]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    // Clear selected batches when project changes
    setSelectedBatches([]);
  };

  const loadBatches = async (projectId: string) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', '1');
      queryParams.set('limit', '100'); // Get all batches for the project
      queryParams.set('projectId', projectId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/batches?${queryParams}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Failed to fetch batches: ${response.status}`);
      const data = await response.json();
      
      // Convert batches and calculate valid leads count for each
      const batchesWithValidCount: BatchWithLeads[] = data.batches.map((batch: Batch) => ({
        ...batch,
        validLeadCount: batch.leadCount // For now, assume all leads are valid since we don't have detailed lead data
      }));
      
      setBatches(batchesWithValidCount);
      
    } catch (err: any) {
      console.error('Failed to load batches:', err);
      // Don't set error state here to avoid disrupting the flow
    }
  };
  
  // Load campaign data if in view mode
  useEffect(() => {
    if (isViewMode && viewCampaignId && !loading) {
      // TODO: In a real app, this would come from getCampaignById API
      // For now, just use the first available data as placeholder
      if (projects.length > 0) setSelectedProject(projects[0]);
      if (batches.length > 0) setSelectedBatches([batches[0]]);
      if (templates.length > 0) setSelectedTemplate(templates[0]);
    }
  }, [isViewMode, viewCampaignId, loading, projects, batches, templates]);

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Search states
  const [batchSearch, setBatchSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  
  // Sending states
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sentCount: number; totalRecipients: number } | null>(null);

  // Filter batches by search (sorted newest first)
  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(batchSearch.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter templates by search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.subject.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Calculate valid leads count (for now, assuming all leads in selected batches are valid)
  const getTotalValidLeads = () => {
    return selectedBatches.reduce((total, batch) => {
      return total + batch.validLeadCount;
    }, 0);
  };

  // Check if ready to send
  const canSend = selectedProject && selectedBatches.length > 0 && selectedTemplate && !sending;

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Replace variables in template for preview
  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{companyName\}\}/g, 'Example Corp')
      .replace(/\{\{company\}\}/g, 'Example Corp')
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{name\}\}/g, 'John')
      .replace(/\{\{city\}\}/g, 'Berlin')
      .replace(/\{\{website\}\}/g, 'https://example.com')
      .replace(/\{\{senderName\}\}/g, selectedProject?.senderName || selectedProject?.name || 'Your Name');
  };

  // Handle batch selection
  const handleBatchToggle = (batch: BatchWithLeads) => {
    setSelectedBatches(prev => {
      const isSelected = prev.some(b => b._id === batch._id);
      if (isSelected) {
        return prev.filter(b => b._id !== batch._id);
      } else {
        return [...prev, batch];
      }
    });
  };

  // Handle send confirmation and actual sending
  const handleSend = async () => {
    if (!selectedProject || !selectedTemplate || selectedBatches.length === 0) return;
    
    setShowConfirmModal(false);
    setSending(true);

    try {
      const campaignData: CampaignRequest = {
        name: `Campaign - ${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        projectId: selectedProject._id,
        templateId: selectedTemplate._id,
        batchIds: selectedBatches.map(batch => batch._id)
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send campaign');
      }

      const result = await response.json();
      setSendResult({
        sentCount: result.data.sentCount,
        totalRecipients: result.data.totalRecipients
      });
      setShowSuccessModal(true);

      // Reset state after showing success
      setTimeout(() => {
        setSelectedProject(null);
        setSelectedBatches([]);
        setSelectedTemplate(null);
        setShowSuccessModal(false);
        setSendResult(null);
      }, 3000);

    } catch (err: any) {
      console.error('Campaign send error:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Success icon component
  const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject={selectedProjectId} onProjectChange={handleProjectChange} />
      
      <div className="flex-1 px-7 py-6">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {isViewMode ? 'Campaign Details' : 'New Send'}
              </h1>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {isViewMode ? 'Sent' : 'Draft'}
              </span>
            </div>
            {!isViewMode && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!canSend || sending}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  canSend && !sending
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 mr-2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">Loading campaign data...</div>
              </div>
            </div>
          ) : (
            <>
              {/* Stacked Sections */}
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {/* Project Section */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {selectedProject ? (
                    <CheckIcon />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Project</h3>
                  {selectedProject ? (
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="font-medium">{selectedProject.name}</div>
                      <div className="text-gray-500">{selectedProject.senderEmail}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Choose which project to send from</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowProjectModal(true)}
                disabled={isViewMode}
                className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  isViewMode
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {isViewMode ? 'View project' : 'Choose project'}
              </button>
            </div>

            {/* Leads Section */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {selectedBatches.length > 0 ? (
                    <CheckIcon />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Leads</h3>
                  {selectedBatches.length > 0 ? (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBatches.length} batches - {getTotalValidLeads()} valid leads
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Select lead batches to send to</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowLeadsModal(true)}
                disabled={isViewMode}
                className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  isViewMode
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {isViewMode ? 'View leads' : 'Choose leads'}
              </button>
            </div>

            {/* Template Section */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {selectedTemplate ? (
                    <CheckIcon />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Template</h3>
                  {selectedTemplate ? (
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="font-medium">{selectedTemplate.name}</div>
                      <div className="text-gray-500">{selectedTemplate.subject}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Select an email template</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(true)}
                disabled={isViewMode}
                className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  isViewMode
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {isViewMode ? 'View template' : 'Choose template'}
              </button>
            </div>
              </div>
              
              {/* Email Preview */}
              <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            {selectedTemplate ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden max-w-md mx-auto">
                {/* Phone-style email header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <div className="text-xs text-gray-500 mb-1">From: {selectedProject?.senderEmail || 'sender@example.com'}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {replaceVariables(selectedTemplate.subject)}
                  </div>
                </div>
                {/* Email body */}
                <div className="p-4 bg-white">
                  <div
                    className="text-sm text-gray-800 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{
                      __html: replaceVariables(selectedTemplate.body)
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <p className="text-sm">Select a template to see the preview</p>
              </div>
            )}
          </div>

          {/* Project Selection Modal */}
          {showProjectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Choose Project</h3>
                  <button
                    onClick={() => setShowProjectModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No projects found</p>
                      <p className="text-xs mt-1">Create a project in Settings first</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <button
                        key={project._id}
                        onClick={() => {
                          const newProjectId = project._id;
                          setSelectedProjectId(newProjectId);
                          setSelectedProject(project);
                          setShowProjectModal(false);
                        }}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
                      >
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.senderEmail}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Leads Selection Modal */}
          {showLeadsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Choose Leads</h3>
                  <button
                    onClick={() => setShowLeadsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                  />
                </div>

                {/* Batch list */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-96">
                  {filteredBatches.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No batches found</p>
                      <p className="text-xs mt-1">Import some leads first</p>
                    </div>
                  ) : (
                    filteredBatches.map((batch) => {
                      const isSelected = selectedBatches.some(b => b._id === batch._id);
                      
                      return (
                        <label
                          key={batch._id}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleBatchToggle(batch)}
                            className="mr-3 w-4 h-4 text-accent focus:ring-accent border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">{batch.name}</div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  batch.source === 'Lead Finder Agent' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {batch.source}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDate(batch.createdAt)} • {batch.validLeadCount} valid leads of {batch.leadCount} total
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Done button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowLeadsModal(false)}
                    className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    Done ({selectedBatches.length} selected)
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Template Selection Modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Choose Template</h3>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                  />
                </div>

                {/* Template list */}
                <div className="flex-1 overflow-y-auto space-y-2 max-h-96">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No templates found</p>
                      <p className="text-xs mt-1">Create some templates first</p>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <button
                        key={template._id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateModal(false);
                        }}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
                      >
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500 mt-1 truncate">{template.subject}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Send</h3>
                </div>
                
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Project:</span>
                    <span className="font-medium text-gray-900">{selectedProject?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sender:</span>
                    <span className="text-gray-700">{selectedProject?.senderEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Batches:</span>
                    <span className="text-gray-700">{selectedBatches.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valid leads:</span>
                    <span className="text-gray-700 font-medium">{getTotalValidLeads()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Template:</span>
                    <span className="text-gray-700">{selectedTemplate?.name}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    Confirm & Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Started!</h3>
                <p className="text-gray-600 mb-4">
                  {sendResult ? 
                    `${sendResult.sentCount} of ${sendResult.totalRecipients} emails sent successfully` :
                    `${getTotalValidLeads()} emails queued for sending`
                  }
                </p>
                <div className="w-8 h-1 bg-green-600 rounded mx-auto"></div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}