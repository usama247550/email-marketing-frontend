'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Inline SVG icons — no icon lib dependency
const Icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  leadFinder: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  leads: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  campaigns: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  templates: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  sending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  automation: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  email: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  collapse: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 9l-3 3 3 3" />
    </svg>
  ),
  expand: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M12 15l3-3-3-3" />
    </svg>
  ),
  hamburger: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Icons.dashboard },
  { label: 'Lead Finder', href: '/lead-finder', icon: Icons.leadFinder },
  { label: 'Leads', href: '/leads', icon: Icons.leads },
  { label: 'Campaigns', href: '/campaigns', icon: Icons.campaigns },
  { label: 'Templates', href: '/templates', icon: Icons.templates },
  { label: 'Sending', href: '/sending', icon: Icons.sending },
  { label: 'Automation', href: '/automation', icon: Icons.automation },
  { label: 'Settings', href: '/settings', icon: Icons.settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch (e) {
        // ignore localStorage errors in private mode
      }
      return next;
    });
  };

  const openMobileDrawer = useCallback(() => setMobileOpen(true), []);
  const closeMobileDrawer = useCallback(() => setMobileOpen(false), []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Shared sidebar content used for both desktop aside and mobile drawer
  const sidebarContent = (
    <>
      {/* Logo & Top Toggle */}
      <div
        className={`
          flex items-center border-b border-[#1E293B]/40 min-h-[65px] px-3.5 py-4 transition-all
          ${collapsed ? 'lg:justify-center justify-between' : 'justify-between'}
        `}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            onClick={collapsed ? toggleSidebar : undefined}
            className={`
              flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-white shrink-0 shadow-sm shadow-accent/40
              ${collapsed ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''}
            `}
            title={collapsed ? 'Expand sidebar' : undefined}
          >
            {Icons.email}
          </div>
          {/* On mobile drawer, always show text. On desktop, respect collapsed state */}
          <div className={`leading-tight overflow-hidden whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-white font-bold text-sm tracking-tight">ArSwift</p>
            <p className="text-[#94A3B8] text-[10px] font-medium">Email Marketing</p>
          </div>
        </div>

        {/* Close button for mobile drawer */}
        <button
          onClick={closeMobileDrawer}
          className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close menu"
        >
          {Icons.close}
        </button>

        {/* Desktop collapse button */}
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 active:scale-95 transition-all"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            {Icons.collapse}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group min-h-[44px]
                ${collapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'}
                ${active
                  ? 'bg-accent text-white shadow-sm shadow-accent/30 font-semibold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-[#94A3B8]/80 group-hover:text-white'}`}>
                {item.icon}
              </span>
              {/* On mobile drawer: always show label. On desktop: respect collapsed state */}
              <span className={`truncate whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Toggle Button (desktop only) */}
      <div className="hidden lg:block p-2 border-t border-[#1E293B]/40">
        <button
          onClick={toggleSidebar}
          className={`
            w-full flex items-center gap-2.5 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-white/5 active:scale-98 transition-all
            ${collapsed ? 'justify-center px-0' : 'px-3'}
          `}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="shrink-0">
            {collapsed ? Icons.expand : Icons.collapse}
          </span>
          {!collapsed && <span className="truncate">Collapse sidebar</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar: visible from lg upward ── */}
      <aside
        className={`
          hidden lg:flex flex-col min-h-screen bg-[#070B14] border-r border-[#1E293B]/60 shrink-0
          transition-[width] duration-300 ease-in-out
          ${collapsed ? 'w-[68px]' : 'w-[220px]'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile hamburger button: exported via CSS custom property for topbar to use ── */}
      {/* This button is rendered in the Topbar component instead, see Topbar.tsx */}

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] max-w-[80vw] bg-[#070B14] border-r border-[#1E293B]/60
          flex flex-col transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* ── Expose the hamburger opener for the topbar to call ── */}
      {/* We attach the open function to a global so the Topbar can call it without prop drilling through layout */}
      <HamburgerBridge onOpen={openMobileDrawer} />
    </>
  );
}

/**
 * Invisible component that exposes the mobile sidebar open function
 * on `window.__openMobileSidebar` so the Topbar can call it without prop drilling.
 */
function HamburgerBridge({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    (window as any).__openMobileSidebar = onOpen;
    return () => {
      delete (window as any).__openMobileSidebar;
    };
  }, [onOpen]);
  return null;
}
