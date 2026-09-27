'use client';

import { PROJECTS } from '@/lib/mockData';
import type { ProjectId } from '@/lib/mockData';

interface TopbarProps {
  selectedProject: ProjectId;
  onProjectChange: (id: ProjectId) => void;
}

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Topbar({ selectedProject, onProjectChange }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-7 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
      {/* Left: project selector */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value as ProjectId)}
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer transition-all"
          >
            {PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {/* Chevron */}
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </div>

      {/* Center: search */}
      <div className="flex-1 max-w-sm mx-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            readOnly
          />
        </div>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            A
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">Ali Raza</p>
            <p className="text-[10px] text-accent font-medium">Pro Plan</p>
          </div>
          <svg className="text-gray-400 group-hover:text-gray-600 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
