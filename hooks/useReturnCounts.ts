import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useReturnCounts = (vendorId: string | null) => {
  const [newReturnsCount, setNewReturnsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for pending returns
    const returnsQuery = query(
      collection(db, 'returns'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      returnsQuery,
      (snapshot) => {
        setNewReturnsCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        console.error('Returns count listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendorId]);

  return { newReturnsCount, loading };
};
