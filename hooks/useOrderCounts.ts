import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useOrderCounts = (vendorId: string | null) => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for new/pending orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId),
      where('orderStatus', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        setNewOrdersCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        console.error('Orders count listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendorId]);

  return { newOrdersCount, loading };
};
