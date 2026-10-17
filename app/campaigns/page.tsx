'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/dashboard/Topbar';
import { fetchCampaigns, getProjects, type ApiCampaign, type Project } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  sentDate: string; // ISO date string
  recipients: number;
  opens: number;
  openRate: number; // percentage
  unsubscribed: number;
  unsubscribeRate: number; // percentage
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const ITEMS_PER_PAGE = 25;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsData] = await Promise.all([
        getProjects()
      ]);
      
      setProjects(projectsData);
      
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const campaignProject = selectedProject === 'all' ? undefined : selectedProject;
      const apiCampaigns = await fetchCampaigns(campaignProject);
      
      // Convert API campaigns to frontend format
      const formattedCampaigns: Campaign[] = apiCampaigns.map((campaign: ApiCampaign) => {
        // Guard: null is typeof 'object', so check for null explicitly first
        const projectName = campaign.projectId != null && typeof campaign.projectId === 'object'
          ? campaign.projectId.name
          : campaign.projectId
            ? projects.find(p => p._id === campaign.projectId)?.name || 'Unknown Project'
            : 'Deleted project';
        
        const openRate = campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0;
        const unsubscribeRate = 0; // We don't have unsubscribe data yet
        
        return {
          id: campaign._id,
          name: campaign.name,
          projectId: campaign.projectId != null && typeof campaign.projectId === 'object'
            ? campaign.projectId._id
            : (typeof campaign.projectId === 'string' ? campaign.projectId : ''),
          projectName,
          sentDate: campaign.createdAt, // Use createdAt as sent date
          recipients: campaign.sentCount,
          opens: campaign.openedCount,
          openRate,
          unsubscribed: 0, // We don't have unsubscribe data yet
          unsubscribeRate
        };
      });
      
      setCampaigns(formattedCampaigns);
      
    } catch (err: any) {
      console.error('Failed to load campaigns:', err);
      setCampaigns([]);
    }
  };

  // Load projects and campaigns on component mount
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload campaigns when project filter changes
  useEffect(() => {
    if (!loading) {
      loadCampaigns();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, loading, projects]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setCurrentPage(1); // Reset to first page when changing project
  };

  // Filter campaigns by search query
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return campaigns;
    
    const query = searchQuery.toLowerCase();
    return campaigns.filter(campaign => 
      campaign.name.toLowerCase().includes(query) ||
      campaign.projectName.toLowerCase().includes(query)
    );
  }, [searchQuery, campaigns]);

  // Pagination calculations
  const totalCampaigns = filteredCampaigns.length;
  const totalPages = Math.ceil(totalCampaigns / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalCampaigns);
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  // Format date helper
  const formatSentDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Handle row click (navigate to view mode)
  const handleRowClick = (campaign: Campaign) => {
    // Navigate to sending page in view mode with campaign data
    router.push(`/sending?view=${campaign.id}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setShowMenu(null); // Close any open menus
  };

  // Delete campaign functions
  const handleDeleteCampaign = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteModal(true);
    setShowMenu(null);
  };

  const confirmDeleteCampaign = () => {
    if (campaignToDelete) {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignToDelete.id));
      setShowDeleteModal(false);
      setCampaignToDelete(null);
    }
  };

  const cancelDeleteCampaign = () => {
    setShowDeleteModal(false);
    setCampaignToDelete(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject={selectedProject} onProjectChange={handleProjectChange} />
      
      <div className="flex-1 px-4 py-4 md:px-6 lg:px-7 md:py-6">
        <div className="max-w-[1400px] w-full mx-auto space-y-5 md:space-y-6 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-sm text-gray-400 mt-0.5">View your sent email campaigns.</p>
            </div>
            <button
              onClick={() => router.push('/sending')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 min-h-[40px] rounded-lg transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Campaign
            </button>
          </div>

          {/* Search and Pagination Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 sm:max-w-md">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search for a campaign"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 min-h-[40px] text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* Pagination Info */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-500">
                {totalCampaigns > 0 ? (
                  <>
                    {startIndex + 1}-{endIndex} of {totalCampaigns}, page {currentPage} of {totalPages}
                  </>
                ) : (
                  'No campaigns found'
                )}
              </span>
              
              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Campaigns Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
                <p className="text-sm font-medium text-gray-700">Loading campaigns...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3 text-red-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Error loading campaigns</p>
                <p className="text-xs text-gray-400 mb-3">{error}</p>
                <button 
                  onClick={() => fetchData()}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {searchQuery ? 'No campaigns match your search' : 'No campaigns yet'}
                </p>
                <p className="text-xs text-gray-400">
                  {searchQuery ? 'Try a different search term.' : 'Create your first campaign to get started.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile campaign cards (< md) */}
                <div className="md:hidden divide-y divide-gray-100">
                  {paginatedCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => handleRowClick(campaign)}
                      className="p-4 space-y-3 cursor-pointer active:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate" title={campaign.name}>
                            {campaign.name}
                          </div>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {campaign.projectName}
                          </span>
                        </div>
                        {/* "..." menu */}
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenu(showMenu === campaign.id ? null : campaign.id);
                            }}
                            className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"/>
                              <circle cx="12" cy="5" r="1"/>
                              <circle cx="12" cy="19" r="1"/>
                            </svg>
                          </button>
                          {showMenu === campaign.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRowClick(campaign); setShowMenu(null); }}
                                className="w-full text-left px-3 py-2.5 min-h-[40px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >View</button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(null); }}
                                className="w-full text-left px-3 py-2.5 min-h-[40px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >Duplicate</button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign); }}
                                className="w-full text-left px-3 py-2.5 min-h-[40px] text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatSentDate(campaign.sentDate)}
                      </div>
                      {/* 3-column stat grid */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2.5">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.recipients.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">Recipients</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.opens.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">Opens ({campaign.openRate.toFixed(0)}%)</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.unsubscribed.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">Unsub</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop campaign table (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unsubscribed</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedCampaigns.map((campaign) => (
                        <tr 
                          key={campaign.id} 
                          onClick={() => handleRowClick(campaign)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900 mb-1 truncate max-w-xs" title={campaign.name}>
                                {campaign.name}
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {campaign.projectName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            Sent on {formatSentDate(campaign.sentDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{campaign.recipients.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">100%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{campaign.opens.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{campaign.openRate.toFixed(1)}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{campaign.unsubscribed.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{campaign.unsubscribeRate.toFixed(1)}%</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMenu(showMenu === campaign.id ? null : campaign.id);
                                }}
                                className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1"/>
                                  <circle cx="12" cy="5" r="1"/>
                                  <circle cx="12" cy="19" r="1"/>
                                </svg>
                              </button>
                              {showMenu === campaign.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRowClick(campaign); setShowMenu(null); }}
                                    className="w-full text-left px-3 py-2.5 min-h-[40px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >View</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(null); }}
                                    className="w-full text-left px-3 py-2.5 min-h-[40px] text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >Duplicate</button>
                                  <hr className="my-1 border-gray-100" />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign); }}
                                    className="w-full text-left px-3 py-2.5 min-h-[40px] text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >Delete</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 min-h-[40px] text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-accent text-white'
                            : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 min-h-[40px] text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && campaignToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Delete Campaign</h2>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                    Are you sure you want to delete this campaign?
                  </h3>
                  <p className="text-sm text-gray-500 break-words">
                    You are about to delete &quot;<strong>{campaignToDelete.name}</strong>&quot;. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
              <button
                onClick={cancelDeleteCampaign}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCampaign}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-center"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
}