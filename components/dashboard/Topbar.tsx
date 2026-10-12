'use client';

import { useState, useEffect } from 'react';
import { getProjects } from '@/lib/api';
import type { Project } from '@/lib/api';

interface TopbarProps {
  selectedProject: string;
  onProjectChange: (id: string) => void;
}

export default function Topbar({ selectedProject, onProjectChange }: TopbarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
        // Keep empty array on error - "All Projects" will still be available
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Build project options: "All Projects" first, then real projects
  const projectOptions = [
    { _id: 'all', name: 'All Projects' },
    ...projects
  ];

  return (
    <header className="flex items-center px-7 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
      {/* Project selector */}
      <div className="relative">
        <select
          value={selectedProject}
          onChange={(e) => onProjectChange(e.target.value)}
          className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer transition-all"
          disabled={loading}
        >
          {projectOptions.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    </header>
  );
}
