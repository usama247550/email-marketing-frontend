'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AuthGate from '@/components/auth/AuthGate';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) {
    return (
      <AuthGate>
        <div className="flex w-full min-h-screen min-w-0 flex-1 items-stretch justify-center">
          {children}
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <div className="flex w-full min-h-screen min-w-0 flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-auto theme-surface min-w-0">
          {children}
        </main>
      </div>
    </AuthGate>
  );
}