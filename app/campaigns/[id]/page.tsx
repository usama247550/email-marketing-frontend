import Link from 'next/link';

interface CampaignDetailPageProps {
  params: { id: string };
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      {/* Simple topbar */}
      <header className="flex items-center gap-3 px-7 py-4 bg-white border-b border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-gray-500">Campaign Detail</span>
      </header>

      {/* Placeholder content */}
      <div className="flex-1 flex flex-col items-center justify-center px-7 py-20 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Detail</h1>
        <p className="text-gray-400 text-sm mb-1">
          Campaign ID: <code className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-mono">{params.id}</code>
        </p>
        <p className="text-gray-400 text-sm mt-3 max-w-sm leading-relaxed">
          This page is coming soon. Full campaign analytics, lead lists, email sequences, and reporting will be built here in the next step.
        </p>

        <div className="flex items-center gap-3 mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-accent/20"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Back to Dashboard
          </Link>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-800 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            All Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
