// ---------------------------------------------------------------------------
// Frontend-only static data
// - Project list (selector options) — real projects from DB come via API
// - Chart time-series — will be wired to backend once a chart-data endpoint exists
// - % change values — placeholder until backend exposes trend comparison
// - Icon color map — purely cosmetic, frontend concern
// ---------------------------------------------------------------------------

// ── Project selector ─────────────────────────────────────────────────────────

export const PROJECTS = [
  { id: 'all', name: 'All Projects', slug: 'all' },
  { id: 'arswift', name: 'Arswift', slug: 'arswift' },
  { id: 'goldsilver', name: 'Goldsilver.de', slug: 'goldsilver' },
  { id: 'anticellulite', name: 'Cellulite-Anticellulite', slug: 'anticellulite' },
];

export type ProjectId = 'all' | 'arswift' | 'goldsilver' | 'anticellulite';

// ── % change placeholders (until backend exposes trend data) ─────────────────

export interface StatChanges {
  totalLeadsChange: number;
  emailsFoundChange: number;
  emailsSentChange: number;
  emailsOpenedChange: number;
  repliesChange: number;
}

export const STAT_CHANGES_BY_PROJECT: Record<ProjectId, StatChanges> = {
  all:          { totalLeadsChange: 12, emailsFoundChange: 8,  emailsSentChange: 15, emailsOpenedChange: 10, repliesChange: 5  },
  arswift:      { totalLeadsChange: 12, emailsFoundChange: 8,  emailsSentChange: 15, emailsOpenedChange: 9,  repliesChange: 5  },
  goldsilver:   { totalLeadsChange: 7,  emailsFoundChange: 11, emailsSentChange: 9,  emailsOpenedChange: 14, repliesChange: 3  },
  anticellulite:{ totalLeadsChange: -3, emailsFoundChange: 6,  emailsSentChange: 4,  emailsOpenedChange: -2, repliesChange: 8  },
};

// ── Chart time-series (last 10 days, per project) ────────────────────────────

export interface ChartPoint {
  date: string;
  sent: number;
  opened: number;
  replied: number;
}

export const CHART_DATA_BY_PROJECT: Record<ProjectId, ChartPoint[]> = {
  all: [
    { date: 'Sep 16', sent: 120, opened: 60,  replied: 18 },
    { date: 'Sep 17', sent: 145, opened: 72,  replied: 22 },
    { date: 'Sep 18', sent: 130, opened: 65,  replied: 19 },
    { date: 'Sep 19', sent: 160, opened: 88,  replied: 27 },
    { date: 'Sep 20', sent: 175, opened: 95,  replied: 30 },
    { date: 'Sep 21', sent: 155, opened: 78,  replied: 24 },
    { date: 'Sep 22', sent: 190, opened: 105, replied: 35 },
    { date: 'Sep 23', sent: 210, opened: 118, replied: 40 },
    { date: 'Sep 24', sent: 195, opened: 110, replied: 38 },
    { date: 'Sep 25', sent: 225, opened: 130, replied: 45 },
  ],
  arswift: [
    { date: 'Sep 16', sent: 40, opened: 20, replied: 6  },
    { date: 'Sep 17', sent: 55, opened: 28, replied: 8  },
    { date: 'Sep 18', sent: 48, opened: 24, replied: 7  },
    { date: 'Sep 19', sent: 62, opened: 35, replied: 10 },
    { date: 'Sep 20', sent: 70, opened: 38, replied: 12 },
    { date: 'Sep 21', sent: 58, opened: 30, replied: 9  },
    { date: 'Sep 22', sent: 75, opened: 42, replied: 14 },
    { date: 'Sep 23', sent: 85, opened: 48, replied: 16 },
    { date: 'Sep 24', sent: 78, opened: 44, replied: 15 },
    { date: 'Sep 25', sent: 90, opened: 52, replied: 18 },
  ],
  goldsilver: [
    { date: 'Sep 16', sent: 50, opened: 28, replied: 8  },
    { date: 'Sep 17', sent: 58, opened: 32, replied: 10 },
    { date: 'Sep 18', sent: 52, opened: 28, replied: 8  },
    { date: 'Sep 19', sent: 65, opened: 38, replied: 12 },
    { date: 'Sep 20', sent: 72, opened: 42, replied: 13 },
    { date: 'Sep 21', sent: 60, opened: 34, replied: 10 },
    { date: 'Sep 22', sent: 78, opened: 44, replied: 14 },
    { date: 'Sep 23', sent: 88, opened: 50, replied: 18 },
    { date: 'Sep 24', sent: 80, opened: 46, replied: 16 },
    { date: 'Sep 25', sent: 92, opened: 54, replied: 19 },
  ],
  anticellulite: [
    { date: 'Sep 16', sent: 30, opened: 12, replied: 4 },
    { date: 'Sep 17', sent: 32, opened: 12, replied: 4 },
    { date: 'Sep 18', sent: 30, opened: 13, replied: 4 },
    { date: 'Sep 19', sent: 33, opened: 15, replied: 5 },
    { date: 'Sep 20', sent: 33, opened: 15, replied: 5 },
    { date: 'Sep 21', sent: 37, opened: 14, replied: 5 },
    { date: 'Sep 22', sent: 37, opened: 19, replied: 7 },
    { date: 'Sep 23', sent: 37, opened: 20, replied: 6 },
    { date: 'Sep 24', sent: 37, opened: 20, replied: 7 },
    { date: 'Sep 25', sent: 43, opened: 24, replied: 8 },
  ],
};

// ── Campaign icon colours (cosmetic, cycled by index) ────────────────────────

export const CAMPAIGN_ICON_COLORS = [
  'bg-purple-500',
  'bg-red-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
];
