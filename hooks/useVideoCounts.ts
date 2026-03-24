import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useVideoCounts = (vendorId: string | null) => {
  const [pendingVideosCount, setPendingVideosCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for pending videos
    const videosQuery = query(
      collection(db, 'influencerVideos'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      videosQuery,
      (snapshot) => {
        setPendingVideosCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        console.error('Videos count listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendorId]);

  return { pendingVideosCount, loading };
};
