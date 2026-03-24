'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { auth } from '@/lib/firebase';

export default function VendorGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { vendor, loading } = useVendorAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !redirecting) {
      const currentUser = auth.currentUser;
      
      console.log('VendorGuard check:', { 
        loading, 
        hasVendor: !!vendor, 
        hasUser: !!currentUser,
        vendorStatus: vendor?.status,
        vendorData: vendor 
      });
      
      // If no user authenticated, redirect to login
      if (!currentUser) {
        console.log('No user authenticated - redirecting to login');
        setRedirecting(true);
        router.push('/vendor/auth/login');
        return;
      }
      
      // If user is authenticated but no vendor data found
      if (currentUser && !vendor) {
        console.log('User authenticated but no vendor data found - redirecting to error');
        setRedirecting(true);
        router.push('/vendor/auth/error');
        return;
      }
      
      // If vendor exists, check status
      if (vendor) {
        if (vendor.status === 'pending' || vendor.status === 'rejected') {
          console.log('Vendor pending/rejected - redirecting to pending page');
          setRedirecting(true);
          router.push('/vendor/auth/pending');
          return;
        }
        
        if (vendor.status === 'suspended') {
          console.log('Vendor suspended - redirecting to pending page');
          setRedirecting(true);
          router.push('/vendor/auth/pending');
          return;
        }
        
        // Only approved vendors can access
        if (vendor.status !== 'approved') {
          console.log('Vendor not approved - redirecting to pending page');
          setRedirecting(true);
          router.push('/vendor/auth/pending');
          return;
        }
      }
    }
  }, [vendor, loading, router, redirecting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (redirecting || !vendor || vendor.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
