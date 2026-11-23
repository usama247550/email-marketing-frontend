'use client';

import { useTheme } from '@/components/theme/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle flex items-center gap-2 rounded-xl border theme-border theme-card px-2.5 py-2 min-h-[40px] text-xs font-medium theme-text-secondary theme-hover-surface transition-colors shrink-0"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="relative flex h-7 w-12 items-center rounded-full theme-toggle-track p-0.5">
        <span
          className={`absolute h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isDark ? 'translate-x-0' : 'translate-x-5'
          }`}
        />
        <span className="flex w-full justify-between px-1.5 pointer-events-none">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isDark ? 'text-amber-300 opacity-100' : 'opacity-40'}
            aria-hidden
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={!isDark ? 'text-amber-500 opacity-100' : 'opacity-40'}
            aria-hidden
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </span>
      </span>
      <span className="hidden sm:inline theme-text-primary">
        {!mounted ? 'Theme' : isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}