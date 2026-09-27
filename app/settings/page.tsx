import Link from 'next/link';
export default function SettingsPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <header className="flex items-center px-7 py-4 bg-white border-b border-gray-100">
        <h1 className="text-base font-semibold text-gray-800">Settings</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-7 py-20">
        <p className="text-2xl font-bold text-gray-900 mb-2">Settings</p>
        <p className="text-gray-400 text-sm max-w-sm">Coming soon — workspace and account settings.</p>
        <Link href="/" className="mt-8 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">Back to Dashboard</Link>
      </div>
    </div>
  );
}
