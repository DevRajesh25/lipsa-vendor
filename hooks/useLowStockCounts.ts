import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useLowStockCounts = (vendorId: string | null) => {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for low stock items (stock < 5)
    // Note: Firestore doesn't support < operator with array-contains
    // So we'll get all vendor's inventory and filter client-side
    const inventoryQuery = query(
      collection(db, 'inventory'),
      where('vendorId', '==', vendorId)
    );

    const unsubscribe = onSnapshot(
      inventoryQuery,
      (snapshot) => {
        // Filter items with stock < 5
        const lowStockItems = snapshot.docs.filter(doc => {
          const data = doc.data();
          return (data.stock || 0) < 5;
        });
        
        setLowStockCount(lowStockItems.length);
        setLoading(false);
      },
      (error) => {
        console.error('Low stock count listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendorId]);

  return { lowStockCount, loading };
};
