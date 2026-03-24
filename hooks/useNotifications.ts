import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/lib/types';

export const useNotifications = (vendorId: string | null, maxNotifications: number = 20) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Real-time listener for notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc'),
      limit(maxNotifications)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsList: Notification[] = [];
        let unread = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          const notification: Notification = {
            id: doc.id,
            vendorId: data.vendorId,
            title: data.title,
            message: data.message,
            type: data.type,
            isRead: data.isRead || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            readAt: data.readAt?.toDate(),
            metadata: data.metadata
          };
          
          notificationsList.push(notification);
          if (!notification.isRead) {
            unread++;
          }
        });

        setNotifications(notificationsList);
        setUnreadCount(unread);
        setLoading(false);
      },
      (err) => {
        console.error('Notifications listener error:', err);
        setError(err.message || 'Failed to load notifications');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [vendorId, maxNotifications]);

  return { notifications, unreadCount, loading, error };
};
