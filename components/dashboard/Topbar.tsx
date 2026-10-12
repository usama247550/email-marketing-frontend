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
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Build project options: "All Projects" first, then real projects
  const projectOptions = [
    { _id: 'all', name: 'All Projects' },
    ...projects,
  ];

  return (
    <header className="flex items-center px-4 md:px-6 lg:px-7 py-3 md:py-4 bg-[#0B0F19] border-b border-[#1E293B]/80 sticky top-0 z-10 gap-3 min-w-0">
      {/* Hamburger button — only below lg */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && (window as any).__openMobileSidebar) {
            (window as any).__openMobileSidebar();
          }
        }}
        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:scale-95 transition-all shrink-0"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Project selector */}
      <div className="relative min-w-0 max-w-[200px] sm:max-w-[260px] md:max-w-xs">
        <select
          value={selectedProject}
          onChange={(e) => onProjectChange(e.target.value)}
          className="appearance-none bg-[#111827] border border-[#1E293B] hover:border-[#2E3C54] text-white text-sm font-medium rounded-xl pl-3.5 pr-8 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent cursor-pointer transition-all shadow-sm w-full truncate"
          disabled={loading}
        >
          {projectOptions.map((p) => (
            <option key={p._id} value={p._id} className="bg-[#111827] text-white py-1">
              {p.name}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
    </header>
  );
}
