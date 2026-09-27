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

  const BATCHES_PER_PAGE = 12;
  const LEADS_PER_PAGE = 15;

  // Pagination for batches
  const totalBatchesPages = Math.ceil(MOCK_BATCHES.length / BATCHES_PER_PAGE);
  const paginatedBatches = MOCK_BATCHES.slice(
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Batches</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage your imported and generated lead batches.
              </p>
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
                          <button
                            onClick={() => handleViewBatch(batch)}
                            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            View Leads
                          </button>
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
    </div>
  );
}
