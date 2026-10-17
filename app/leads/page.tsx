'use client';

import { useState, useEffect, useCallback } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import { getBatches, getBatchLeads, deleteBatch, importCsv, getProjects, type Batch, type Lead, type BatchesResponse, type LeadsResponse, type Project } from '@/lib/api';

// Remove mock data - we'll use real API data now

export default function LeadsPage() {
  const [currentView, setCurrentView] = useState<'batches' | 'batch-detail'>('batches');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchesPage, setBatchesPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  
  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projectsLoading, setProjectsLoading] = useState(true);
  
  // API state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  
  // Pagination state  
  const [totalBatchesPages, setTotalBatchesPages] = useState(1);
  const [totalLeadsPages, setTotalLeadsPages] = useState(1);
  
  // CSV Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, number>>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [importing, setImporting] = useState(false);
  const [importProjectId, setImportProjectId] = useState<string>('');
  
  // Delete confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const BATCHES_PER_PAGE = 12;
  const LEADS_PER_PAGE = 15;

  // Define functions first (before useEffects that reference them)
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Keep empty array on error
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchBatchesData = useCallback(async () => {
    try {
      setBatchesLoading(true);
      setBatchesError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', batchesPage.toString());
      queryParams.set('limit', BATCHES_PER_PAGE.toString());
      
      if (selectedProject && selectedProject !== 'all') {
        queryParams.set('projectId', selectedProject);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/batches?${queryParams}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`Failed to fetch batches: ${response.status}`);
      const data = await response.json();
      
      setBatches(data.batches);
      setTotalBatchesPages(data.pagination.totalPages);
    } catch (error) {
      setBatchesError(error instanceof Error ? error.message : 'Failed to fetch batches');
    } finally {
      setBatchesLoading(false);
    }
  }, [batchesPage, selectedProject]);

  const fetchLeadsData = useCallback(async (batchId: string) => {
    try {
      setLeadsLoading(true);
      setLeadsError(null);
      const response = await getBatchLeads(batchId, leadsPage, LEADS_PER_PAGE);
      setLeads(response.leads);
      setTotalLeadsPages(response.pagination.totalPages);
      // Update selected batch with fresh data (this won't cause infinite loop now)
      setSelectedBatch(response.batch);
    } catch (error) {
      setLeadsError(error instanceof Error ? error.message : 'Failed to fetch leads');
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPage]);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch batches on component mount and when page or project changes
  useEffect(() => {
    fetchBatchesData();
  }, [fetchBatchesData]);

  // Fetch leads when page changes (only if we're in detail view)
  useEffect(() => {
    if (currentView === 'batch-detail' && selectedBatch) {
      fetchLeadsData(selectedBatch._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadsPage, currentView, selectedBatch?._id, fetchLeadsData]); // selectedBatch excluded to prevent infinite loop

  const handleViewBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentView('batch-detail');
    setLeadsPage(1); // Reset leads pagination
    fetchLeadsData(batch._id); // Fetch real leads data
  };

  const handleBackToBatches = () => {
    setCurrentView('batches');
    setSelectedBatch(null);
    setLeads([]);
    setLeadsError(null);
  };

  const handleBatchesPageChange = (page: number) => {
    setBatchesPage(page);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setBatchesPage(1); // Reset to first page when changing project
  };

  const handleLeadsPageChange = (page: number) => {
    setLeadsPage(page);
    // fetchLeadsData will be called automatically by the useEffect when leadsPage changes
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // CSV Import Functions - simplified since backend handles parsing
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }
    
    setSelectedFile(file);
    setImportStep('upload'); // Skip mapping step since backend handles it
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      setImporting(true);
      
      // Create FormData with file and projectId
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      if (importProjectId && importProjectId !== '') {
        formData.append('projectId', importProjectId);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/batches/import-csv`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error(`Failed to import CSV: ${response.status}`);
      const data = await response.json();
      
      // Reset modal state
      setShowImportModal(false);
      setSelectedFile(null);
      setImportStep('upload');
      setImportProjectId('');
      
      // Refresh batches list to show the new batch
      setBatchesPage(1); // Go to first page to see the newest batch
      await fetchBatchesData();
      
      // Show success message
      alert(`CSV imported successfully! ${data.leadsImported} leads added (${data.validLeads} valid, ${data.invalidLeads} invalid).`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import CSV file');
    } finally {
      setImporting(false);
    }
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings({});
    setImportStep('upload');
    setImportProjectId('');
  };

  // Delete batch functions
  const handleDeleteBatch = (batch: Batch) => {
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    try {
      setDeleting(true);
      await deleteBatch(batchToDelete._id);
      
      // Refresh batches list
      await fetchBatchesData();
      
      setShowDeleteModal(false);
      setBatchToDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete batch');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteBatch = () => {
    setShowDeleteModal(false);
    setBatchToDelete(null);
  };

  const Pagination = ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500 order-1 sm:order-none">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 min-h-[40px] text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
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
                onClick={() => onPageChange(pageNum)}
                className={`w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
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
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 min-h-[40px] text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      {/* Top bar */}
      <Topbar
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
      />

      {/* Page content */}
      <div className="flex-1 px-4 py-4 md:px-6 lg:px-7 md:py-6 space-y-5 md:space-y-6 max-w-[1400px] w-full mx-auto min-w-0">
        {currentView === 'batches' && (
          <>
            {/* Page heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Batches</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Manage your imported and generated lead batches.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  disabled={projectsLoading}
                  aria-label="Filter by project"
                  className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2.5 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                  {/* Show "Deleted project" option only when at least one batch has a null projectId */}
                  {batches.some((b) => b.projectId == null) && (
                    <option value="__deleted__" disabled>— Deleted project —</option>
                  )}
                </select>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 min-h-[40px] rounded-lg transition-colors shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Import CSV
                </button>
              </div>
            </div>

            {/* Batches container */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {batchesError ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="text-red-600 mb-2 font-medium">Error loading batches</div>
                  <div className="text-sm text-gray-500 mb-4">{batchesError}</div>
                  <button 
                    onClick={() => fetchBatchesData()}
                    className="px-4 py-2.5 min-h-[40px] bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : batchesLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  <div className="mt-2 text-sm text-gray-500">Loading batches...</div>
                </div>
              ) : batches.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-sm font-medium text-gray-700 mb-1">No batches found</div>
                  <div className="text-xs text-gray-400">Import your first CSV file to get started.</div>
                </div>
              ) : (
                <>
                  {/* Mobile Batches List (< md) */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {batches.map((batch) => (
                      <div key={batch._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate" title={batch.name}>
                              {batch.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 truncate" title={batch.projectId != null && typeof batch.projectId === 'object' ? batch.projectId.name : (batch.projectId ? 'Unknown Project' : 'Deleted project')}>
                              {batch.projectId != null
                                ? (typeof batch.projectId === 'object' ? batch.projectId.name : 'Unknown Project')
                                : <span className="text-red-400 italic">Deleted project</span>
                              }
                            </p>
                          </div>
                          <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            batch.source === 'Lead Finder Agent' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {batch.source === 'Lead Finder Agent' ? 'Agent' : batch.source}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(batch.createdAt)}</span>
                          <span className="font-medium text-gray-700">{batch.leadCount} leads</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleViewBatch(batch)}
                            className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 px-3 min-h-[40px] rounded-lg transition-colors text-center"
                          >
                            View Leads
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBatch(batch);
                            }}
                            className="flex items-center justify-center w-10 h-10 min-h-[40px] min-w-[40px] rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors"
                            title="Delete batch"
                            aria-label="Delete batch"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Batches Table (md+) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Batch Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Leads
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {batches.map((batch) => (
                          <tr key={batch._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={batch.name}>
                                {batch.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 truncate max-w-xs" title={batch.projectId != null && typeof batch.projectId === 'object' ? batch.projectId.name : (batch.projectId ? 'Unknown Project' : 'Deleted project')}>
                                {batch.projectId != null
                                  ? (typeof batch.projectId === 'object' ? batch.projectId.name : 'Unknown Project')
                                  : <span className="text-red-400 italic">Deleted project</span>
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                batch.source === 'Lead Finder Agent' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {batch.source === 'Lead Finder Agent' ? 'Agent' : batch.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(batch.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {batch.leadCount} leads
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleViewBatch(batch)}
                                  className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 min-h-[38px] rounded-lg transition-colors"
                                >
                                  View Leads
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBatch(batch);
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg"
                                  title="Delete batch"
                                  aria-label="Delete batch"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <Pagination
                      currentPage={batchesPage}
                      totalPages={totalBatchesPages}
                      onPageChange={handleBatchesPageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {currentView === 'batch-detail' && selectedBatch && (
          <>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={handleBackToBatches}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[40px] px-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate" title={selectedBatch.name}>{selectedBatch.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {selectedBatch.leadCount} leads • {formatDate(selectedBatch.createdAt)}
                </p>
              </div>
            </div>

            {/* Leads container */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {leadsError ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="text-red-600 mb-2 font-medium">Error loading leads</div>
                  <div className="text-sm text-gray-500 mb-4">{leadsError}</div>
                  <button 
                    onClick={() => fetchLeadsData(selectedBatch._id)}
                    className="px-4 py-2.5 min-h-[40px] bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : leadsLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  <div className="mt-2 text-sm text-gray-500">Loading leads...</div>
                </div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-sm font-medium text-gray-700 mb-1">No leads found</div>
                  <div className="text-xs text-gray-400">This batch appears to be empty.</div>
                </div>
              ) : (
                <>
                  {/* Mobile Leads List (< md) */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <div key={lead._id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 text-sm truncate" title={lead.company || '-'}>
                              {lead.company || '-'}
                            </div>
                            {lead.city && (
                              <div className="text-xs text-gray-500 mt-0.5">{lead.city}</div>
                            )}
                          </div>
                          <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'Valid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                        <div className="text-xs space-y-1.5 text-gray-600">
                          {lead.email && (
                            <div className="break-all font-mono text-[11px] text-gray-800" title={lead.email}>
                              {lead.email}
                            </div>
                          )}
                          {lead.website && (
                            <div className="truncate">
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={lead.website}>
                                {lead.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Leads Table (md+) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            City
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Website
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {leads.map((lead) => (
                          <tr key={lead._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={lead.company || '-'}>
                                {lead.company || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lead.city || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                              {lead.website ? (
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate inline-block max-w-[200px]" title={lead.website}>
                                  {lead.website}
                                </a>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-[200px]" title={lead.email || '-'}>
                              {lead.email || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lead.status === 'Valid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg" aria-label="Edit lead">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button className="text-gray-400 hover:text-red-600 transition-colors p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg" aria-label="Delete lead">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <Pagination
                      currentPage={leadsPage}
                      totalPages={totalLeadsPages}
                      onPageChange={handleLeadsPageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && batchToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Delete Batch</h2>
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
                    Are you sure you want to delete this batch and all its leads?
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 break-words">
                    You are about to delete &quot;<strong>{batchToDelete.name}</strong>&quot; containing{' '}
                    <strong>{batchToDelete.leadCount} leads</strong>. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
              <button
                onClick={cancelDeleteBatch}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteBatch}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {deleting && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                )}
                {deleting ? 'Deleting...' : 'Delete Batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Import CSV</h2>
              <button
                onClick={resetImportModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              <div className="text-center">
                <div className="mb-3">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">Upload CSV File</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                  Select a CSV file containing your leads. Expected columns: Company, Email, Website, City.
                </p>
                
                <label className="relative block cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full bg-accent hover:bg-accent-hover text-white px-5 py-3 min-h-[44px] rounded-lg font-medium transition-colors flex items-center justify-center">
                    Choose CSV File
                  </div>
                </label>
                
                {selectedFile && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-left">
                    <p className="text-xs sm:text-sm text-green-800 break-all">
                      Selected: <span className="font-medium">{selectedFile.name}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Project Selection */}
              <div>
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project (Optional)
                </label>
                <select
                  id="project-select"
                  value={importProjectId}
                  onChange={(e) => setImportProjectId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2.5 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all appearance-none"
                  disabled={projectsLoading}
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Column mapping preview container with horizontal scroll support */}
              {csvHeaders.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {csvHeaders.map((header, idx) => (
                          <th key={idx} className="px-3 py-2 font-medium text-gray-600 whitespace-nowrap">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvData.slice(0, 3).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 text-gray-700 whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
              <button
                onClick={resetImportModal}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[40px] text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </button>
              {selectedFile && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full sm:w-auto px-5 py-2.5 min-h-[40px] text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {importing && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  )}
                  {importing ? 'Importing...' : 'Import CSV'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
