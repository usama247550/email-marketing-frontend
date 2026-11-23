'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredAuthToken } from '@/lib/auth';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/login') {
      const token = getStoredAuthToken();
      if (token) {
        router.replace('/');
        return;
      }
      setReady(true);
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex w-full flex-1 min-h-screen items-center justify-center theme-surface theme-text-secondary text-sm">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}