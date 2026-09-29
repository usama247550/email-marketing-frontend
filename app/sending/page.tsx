'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PROJECTS, type ProjectId } from '@/lib/mockData';
import Topbar from '@/components/dashboard/Topbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  senderEmail: string;
}

interface Lead {
  id: string;
  company: string;
  city: string;
  website: string;
  email: string;
  status: 'Valid' | 'Invalid';
}

interface Batch {
  id: string;
  name: string;
  source: 'CSV Import' | 'Agent';
  date: string;
  leadCount: number;
  leads: Lead[];
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PROJECTS: Project[] = [
  { id: 'arswift', name: 'Arswift', senderEmail: 'hello@arswift.com' },
  { id: 'goldsilver', name: 'Goldsilver.de', senderEmail: 'info@goldsilver.de' },
  { id: 'anticellulite', name: 'Cellulite-Anticellulite', senderEmail: 'support@anticellulite.com' },
];

const MOCK_BATCHES: Batch[] = [
  {
    id: '1',
    name: 'Frankfurt - Wellness Center',
    source: 'Agent',
    date: '2024-03-15',
    leadCount: 45,
    leads: Array.from({ length: 45 }, (_, i) => ({
      id: `1-${i + 1}`,
      company: `Wellness Corp ${i + 1}`,
      city: 'Frankfurt',
      website: `https://wellness${i + 1}.de`,
      email: `contact@wellness${i + 1}.de`,
      status: Math.random() > 0.3 ? 'Valid' : 'Invalid' as 'Valid' | 'Invalid'
    }))
  },
  {
    id: '2',
    name: 'berlin_restaurants.csv',
    source: 'CSV Import',
    date: '2024-03-14',
    leadCount: 120,
    leads: Array.from({ length: 120 }, (_, i) => ({
      id: `2-${i + 1}`,
      company: `Restaurant ${i + 1}`,
      city: 'Berlin',
      website: `https://restaurant${i + 1}.de`,
      email: `info@restaurant${i + 1}.de`,
      status: Math.random() > 0.25 ? 'Valid' : 'Invalid' as 'Valid' | 'Invalid'
    }))
  },
  {
    id: '3',
    name: 'Munich - Tech Startups',
    source: 'Agent',
    date: '2024-03-13',
    leadCount: 78,
    leads: Array.from({ length: 78 }, (_, i) => ({
      id: `3-${i + 1}`,
      company: `TechStart ${i + 1}`,
      city: 'Munich',
      website: `https://techstart${i + 1}.com`,
      email: `hello@techstart${i + 1}.com`,
      status: Math.random() > 0.2 ? 'Valid' : 'Invalid' as 'Valid' | 'Invalid'
    }))
  },
  {
    id: '4',
    name: 'healthcare_providers.csv',
    source: 'CSV Import',
    date: '2024-03-12',
    leadCount: 95,
    leads: Array.from({ length: 95 }, (_, i) => ({
      id: `4-${i + 1}`,
      company: `Health Plus ${i + 1}`,
      city: 'Hamburg',
      website: `https://health${i + 1}.de`,
      email: `contact@health${i + 1}.de`,
      status: Math.random() > 0.35 ? 'Valid' : 'Invalid' as 'Valid' | 'Invalid'
    }))
  },
  {
    id: '5',
    name: 'Cologne - Marketing Agencies',
    source: 'Agent',
    date: '2024-03-11',
    leadCount: 62,
    leads: Array.from({ length: 62 }, (_, i) => ({
      id: `5-${i + 1}`,
      company: `Marketing Pro ${i + 1}`,
      city: 'Cologne',
      website: `https://marketing${i + 1}.de`,
      email: `team@marketing${i + 1}.de`,
      status: Math.random() > 0.3 ? 'Valid' : 'Invalid' as 'Valid' | 'Invalid'
    }))
  },
  // Generate more batches...
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 6}`,
    name: i % 2 === 0 ? `leads_batch_${i + 6}.csv` : `${['Stuttgart', 'Düsseldorf', 'Leipzig', 'Nuremberg', 'Dresden'][i % 5]} - ${['Fitness', 'Consulting', 'E-commerce', 'Real Estate', 'Education'][i % 5]}`,
    source: (i % 2 === 0 ? 'CSV Import' : 'Agent') as 'CSV Import' | 'Agent',
    date: new Date(Date.now() - (i + 6) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    leadCount: Math.floor(Math.random() * 150) + 20,
    leads: Array.from({ length: Math.floor(Math.random() * 150) + 20 }, (_, j) => ({
      id: `${i + 6}-${j + 1}`,
      company: `Company ${j + 1}`,
      city: ['Stuttgart', 'Düsseldorf', 'Leipzig', 'Nuremberg', 'Dresden'][i % 5],
      website: `https://company${j + 1}.com`,
      email: `info@company${j + 1}.com`,
      status: Math.random() > 0.3 ? 'Valid' : 'Invalid' as 'Valid' | 'Invalid'
    }))
  }))
];

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Wellness Outreach',
    subject: 'Website Anfrage für {{companyName}}',
    body: '<p>Hallo {{firstName}},</p><p>Ich habe Ihre Website gefunden und finde Ihr Angebot sehr interessant. Wir würden gerne mehr über Ihre Dienstleistungen erfahren.</p><p>Mit freundlichen Grüßen,<br>{{senderName}}</p>',
  },
  {
    id: '2',
    name: 'Cold Intro – Tech',
    subject: 'Quick question about {{companyName}}',
    body: '<p>Hi {{firstName}},</p><p>I came across {{companyName}} while researching companies in {{city}} and I\'d love to connect. We help businesses like yours grow their customer base through targeted outreach.</p><p>Would you be open to a quick 15-minute call?</p><p>Best,<br>{{senderName}}</p>',
  },
  {
    id: '3',
    name: 'Follow-Up #1',
    subject: 'Following up — {{companyName}}',
    body: '<p>Hi {{firstName}},</p><p>I wanted to follow up on my previous email. I noticed you visited our website at {{website}} — happy to answer any questions you might have.</p><p>Looking forward to hearing from you,<br>{{senderName}}</p>',
  },
  {
    id: '4',
    name: 'Restaurant Partnership',
    subject: 'Partnering with {{companyName}} 🍽️',
    body: '<p>Hallo {{firstName}},</p><p>Ihr Restaurant in {{city}} hat mich wirklich beeindruckt. Ich würde gerne eine mögliche Zusammenarbeit besprechen.</p><p>Können wir kurz telefonieren?</p><p>Viele Grüße,<br>{{senderName}}</p>',
  },
  {
    id: '5',
    name: 'Re-engagement',
    subject: "It's been a while, {{firstName}}",
    body: "<p>Hey {{firstName}},</p><p>It's been a few weeks since we last spoke about {{companyName}}. I wanted to check in and see if now might be a better time to connect.</p><p>We've helped dozens of companies in {{city}} achieve real results — I'd love to share some case studies.</p><p>Cheers,<br>{{senderName}}</p>",
  },
];
// ─── Main Component ───────────────────────────────────────────────────────────

export default function SendingPage() {
  const searchParams = useSearchParams();
  const viewCampaignId = searchParams.get('view'); // Check if we're viewing an existing campaign
  const isViewMode = !!viewCampaignId;
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<Batch[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Load campaign data if in view mode
  useEffect(() => {
    if (isViewMode && viewCampaignId) {
      // Mock data for viewing a campaign - in real app this would come from API
      const mockCampaignData = {
        '1': {
          project: MOCK_PROJECTS[0], // Arswift
          batches: [MOCK_BATCHES[0]], // Frankfurt - Wellness Center
          template: MOCK_TEMPLATES[0], // Wellness Outreach
        },
        '2': {
          project: MOCK_PROJECTS[1], // Goldsilver.de
          batches: [MOCK_BATCHES[1]], // berlin_restaurants.csv
          template: MOCK_TEMPLATES[1], // Cold Intro – Tech
        },
        // Add more mock campaign data as needed
      };

      const campaignData = mockCampaignData[viewCampaignId as keyof typeof mockCampaignData];
      if (campaignData) {
        setSelectedProject(campaignData.project);
        setSelectedBatches(campaignData.batches);
        setSelectedTemplate(campaignData.template);
      }
    }
  }, [isViewMode, viewCampaignId]);

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Search states
  const [batchSearch, setBatchSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');

  // Filter batches by search
  const filteredBatches = MOCK_BATCHES.filter(batch =>
    batch.name.toLowerCase().includes(batchSearch.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter templates by search
  const filteredTemplates = MOCK_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.subject.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Calculate valid leads count
  const getTotalValidLeads = () => {
    return selectedBatches.reduce((total, batch) => {
      const validLeads = batch.leads.filter(lead => lead.status === 'Valid').length;
      return total + validLeads;
    }, 0);
  };

  // Check if ready to send
  const canSend = selectedProject && selectedBatches.length > 0 && selectedTemplate;

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
      .replace(/\{\{firstName\}\}/g, 'John')
      .replace(/\{\{city\}\}/g, 'Berlin')
      .replace(/\{\{website\}\}/g, 'https://example.com')
      .replace(/\{\{senderName\}\}/g, selectedProject?.name || 'Your Name');
  };

  // Handle batch selection
  const handleBatchToggle = (batch: Batch) => {
    setSelectedBatches(prev => {
      const isSelected = prev.some(b => b.id === batch.id);
      if (isSelected) {
        return prev.filter(b => b.id !== batch.id);
      } else {
        return [...prev, batch];
      }
    });
  };

  // Handle send confirmation
  const handleSend = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(true);
    
    // Reset state after showing success
    setTimeout(() => {
      setSelectedProject(null);
      setSelectedBatches([]);
      setSelectedTemplate(null);
      setShowSuccessModal(false);
    }, 2000);
  };

  // Success icon component
  const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject="all" onProjectChange={() => {}} />
      
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
                disabled={!canSend}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                  canSend
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send Now
              </button>
            )}
          </div>

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
                  {MOCK_PROJECTS.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectModal(false);
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
                    >
                      <div className="font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.senderEmail}</div>
                    </button>
                  ))}
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
                  {filteredBatches.map((batch) => {
                    const isSelected = selectedBatches.some(b => b.id === batch.id);
                    const validLeadsCount = batch.leads.filter(lead => lead.status === 'Valid').length;
                    
                    return (
                      <label
                        key={batch.id}
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
                                batch.source === 'Agent' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {batch.source}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(batch.date)} • {validLeadsCount} valid leads of {batch.leadCount} total
                          </div>
                        </div>
                      </label>
                    );
                  })}
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
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowTemplateModal(false);
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500 mt-1 truncate">{template.subject}</div>
                    </button>
                  ))}
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
                  {getTotalValidLeads()} emails queued for sending
                </p>
                <div className="w-8 h-1 bg-green-600 rounded mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}