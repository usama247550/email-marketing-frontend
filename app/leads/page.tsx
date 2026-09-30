'use client';

import { useState } from 'react';
import Topbar from '@/components/dashboard/Topbar';

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

// Mock data - 25 batches with leads
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
  ...Array.from({ length: 20 }, (_, i) => ({
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

export default function LeadsPage() {
  const [currentView, setCurrentView] = useState<'batches' | 'batch-detail'>('batches');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchesPage, setBatchesPage] = useState(1);
  const [leadsPage, setLeadsPage] = useState(1);
  
  // CSV Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, number>>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [batches, setBatches] = useState<Batch[]>(MOCK_BATCHES);
  
  // Delete confirmation states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  const BATCHES_PER_PAGE = 12;
  const LEADS_PER_PAGE = 15;

  // Pagination for batches
  const totalBatchesPages = Math.ceil(batches.length / BATCHES_PER_PAGE);
  const paginatedBatches = batches.slice(
    (batchesPage - 1) * BATCHES_PER_PAGE,
    batchesPage * BATCHES_PER_PAGE
  );

  // Pagination for leads
  const totalLeadsPages = selectedBatch ? Math.ceil(selectedBatch.leads.length / LEADS_PER_PAGE) : 0;
  const paginatedLeads = selectedBatch ? selectedBatch.leads.slice(
    (leadsPage - 1) * LEADS_PER_PAGE,
    leadsPage * LEADS_PER_PAGE
  ) : [];

  const handleViewBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentView('batch-detail');
    setLeadsPage(1); // Reset leads pagination
  };

  const handleBackToBatches = () => {
    setCurrentView('batches');
    setSelectedBatch(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // CSV Import Functions
  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Simple CSV parsing - split by comma but handle quotes
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const detectColumnMappings = (headers: string[]): Record<string, number> => {
    const mappings: Record<string, number> = {};
    const lowerHeaders = headers.map(h => h.toLowerCase());
    
    // Auto-detect common column names
    const patterns = {
      company: ['company', 'business', 'name', 'company name', 'business name'],
      email: ['email', 'e-mail', 'mail', 'email address'],
      website: ['website', 'url', 'site', 'web', 'domain'],
      city: ['city', 'location', 'place', 'town']
    };
    
    Object.entries(patterns).forEach(([field, variants]) => {
      for (let i = 0; i < lowerHeaders.length; i++) {
        const header = lowerHeaders[i];
        if (variants.some(variant => header.includes(variant))) {
          mappings[field] = i;
          break;
        }
      }
    });
    
    return mappings;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid CSV file');
      return;
    }
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      
      if (parsed.length === 0) {
        alert('The CSV file appears to be empty');
        return;
      }
      
      const headers = parsed[0];
      const data = parsed.slice(1);
      
      setCsvHeaders(headers);
      setCsvData(data);
      setColumnMappings(detectColumnMappings(headers));
      setImportStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!selectedFile || csvData.length === 0) return;
    
    const leads: Lead[] = csvData.map((row, index) => {
      const company = columnMappings.company !== undefined ? row[columnMappings.company] || '' : `Company ${index + 1}`;
      const email = columnMappings.email !== undefined ? row[columnMappings.email] || '' : '';
      const website = columnMappings.website !== undefined ? row[columnMappings.website] || '' : '';
      const city = columnMappings.city !== undefined ? row[columnMappings.city] || '' : '';
      
      return {
        id: `imported-${Date.now()}-${index}`,
        company: company.replace(/"/g, ''), // Remove quotes
        email: email.replace(/"/g, ''),
        website: website.replace(/"/g, ''),
        city: city.replace(/"/g, ''),
        status: validateEmail(email.replace(/"/g, '')) ? 'Valid' : 'Invalid'
      };
    });

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      name: selectedFile.name,
      source: 'CSV Import',
      date: new Date().toISOString().split('T')[0],
      leadCount: leads.length,
      leads
    };

    // Add to beginning of batches (newest first)
    setBatches([newBatch, ...batches]);
    
    // Reset modal state
    setShowImportModal(false);
    setSelectedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings({});
    setImportStep('upload');
    
    // Show success message
    alert(`Batch imported successfully! ${leads.length} leads added.`);
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings({});
    setImportStep('upload');
  };

  // Delete batch functions
  const handleDeleteBatch = (batch: Batch) => {
    setBatchToDelete(batch);
    setShowDeleteModal(true);
  };

  const confirmDeleteBatch = () => {
    if (batchToDelete) {
      setBatches(prev => prev.filter(batch => batch.id !== batchToDelete.id));
      setShowDeleteModal(false);
      setBatchToDelete(null);
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
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
          className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
        selectedProject="all"
        onProjectChange={() => {}}
      />

      {/* Page content */}
      <div className="flex-1 px-7 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {currentView === 'batches' && (
          <>
            {/* Page heading */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Batches</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Manage your imported and generated lead batches.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shrink-0"
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

            {/* Batches table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Name
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
                    {paginatedBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {batch.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            batch.source === 'Agent' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {batch.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(batch.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {batch.leadCount} leads
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewBatch(batch)}
                              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                              View Leads
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBatch(batch);
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors p-2"
                              title="Delete batch"
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
              
              <Pagination
                currentPage={batchesPage}
                totalPages={totalBatchesPages}
                onPageChange={setBatchesPage}
              />
            </div>
          </>
        )}

        {currentView === 'batch-detail' && selectedBatch && (
          <>
            {/* Back button and batch title */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToBatches}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedBatch.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {selectedBatch.leadCount} leads • {formatDate(selectedBatch.date)}
                </p>
              </div>
            </div>

            {/* Leads table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
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
                    {paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.company}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.city}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {lead.website}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.email}
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
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button className="text-gray-400 hover:text-red-600 transition-colors">
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
              
              <Pagination
                currentPage={leadsPage}
                totalPages={totalLeadsPages}
                onPageChange={setLeadsPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && batchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Delete Batch</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    Are you sure you want to delete this batch and all its leads?
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    You are about to delete "<strong>{batchToDelete.name}</strong>" containing{' '}
                    <strong>{batchToDelete.leadCount} leads</strong>. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDeleteBatch}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBatch}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Import CSV</h2>
              <button
                onClick={resetImportModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Step 1: File Upload */}
              {importStep === 'upload' && (
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Select a CSV file containing your leads. Expected columns: Company, Email, Website, City.
                  </p>
                  
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-medium transition-colors">
                      Choose CSV File
                    </div>
                  </label>
                  
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        Selected: <span className="font-medium">{selectedFile.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Column Mapping */}
              {importStep === 'mapping' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Map Columns</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {csvData.length} rows detected. Please verify the column mappings:
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    {['company', 'email', 'website', 'city'].map((field) => (
                      <div key={field} className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {field}
                          {field === 'company' || field === 'email' ? (
                            <span className="text-red-500 ml-1">*</span>
                          ) : null}
                        </label>
                        <select
                          value={columnMappings[field] ?? ''}
                          onChange={(e) => {
                            const newMappings = { ...columnMappings };
                            if (e.target.value) {
                              newMappings[field] = parseInt(e.target.value);
                            } else {
                              delete newMappings[field];
                            }
                            setColumnMappings(newMappings);
                          }}
                          className="w-48 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-sm"
                        >
                          <option value="">-- Select Column --</option>
                          {csvHeaders.map((header, index) => (
                            <option key={index} value={index}>
                              {header || `Column ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Preview (first 3 rows)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Website</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 3).map((row, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-3 py-2 text-gray-900">
                                {columnMappings.company !== undefined ? row[columnMappings.company] || '-' : '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-900">
                                {columnMappings.email !== undefined ? row[columnMappings.email] || '-' : '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-900">
                                {columnMappings.website !== undefined ? row[columnMappings.website] || '-' : '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-900">
                                {columnMappings.city !== undefined ? row[columnMappings.city] || '-' : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportStep('upload')}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!columnMappings.company || !columnMappings.email}
                      className="px-6 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      Import {csvData.length} Leads
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
