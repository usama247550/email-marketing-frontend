import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <header className="flex items-center gap-3 px-7 py-4 bg-white border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-800">Campaigns</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-7 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaigns</h2>
        <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
          Full campaigns management page coming soon. For now, browse campaigns from the Dashboard.
        </p>
        <Link href="/" className="mt-8 inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-accent/20">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
