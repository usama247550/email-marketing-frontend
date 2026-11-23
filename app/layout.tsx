import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AppShell from '@/components/auth/AppShell';

export const metadata: Metadata = {
  title: 'ArSwift — Email Marketing',
  description: 'Email marketing and lead generation dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('arswift-theme');document.documentElement.setAttribute('data-theme',t==='light'||t==='dark'?t:'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen font-sans antialiased theme-surface theme-text-primary">
        <ThemeProvider>
          <div className="flex w-full min-h-screen min-w-0 flex-1">
            <AppShell>{children}</AppShell>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
