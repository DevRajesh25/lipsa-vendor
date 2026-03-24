'use client';

import { usePathname } from 'next/navigation';
import VendorGuard from '@/components/vendor/VendorGuard';
import Sidebar from '@/components/vendor/Sidebar';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't apply VendorGuard to auth pages
  const isAuthPage = pathname?.startsWith('/vendor/auth');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <VendorGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </VendorGuard>
  );
}
