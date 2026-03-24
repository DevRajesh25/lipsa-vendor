'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/lib/types';
import { getCurrentVendor } from '@/services/authService';

export function useVendorAuth() {
  const [vendor, setVendor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshVendor = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const vendorData = await getCurrentVendor(firebaseUser);
        setVendor(vendorData);
      } catch (error) {
        console.error('Error refreshing vendor data:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      if (firebaseUser) {
        try {
          const vendorData = await getCurrentVendor(firebaseUser);
          console.log('Vendor data:', vendorData);
          setVendor(vendorData);
        } catch (error) {
          console.error('Error getting vendor data:', error);
          setVendor(null);
        }
      } else {
        console.log('No firebase user');
        setVendor(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { vendor, loading, refreshVendor };
}
