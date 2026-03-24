import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/lib/types';

export const getVendorNotifications = async (vendorId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        vendorId: data.vendorId,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.isRead || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate()
      } as Notification;
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    throw new Error(error.message || 'Failed to fetch notifications');
  }
};

export const getUnreadNotificationCount = async (vendorId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error: any) {
    console.error('Get unread count error:', error);
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    throw new Error(error.message || 'Failed to mark notification as read');
  }
};

export const markAllNotificationsAsRead = async (vendorId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('vendorId', '==', vendorId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        isRead: true,
        readAt: serverTimestamp()
      })
    );

    await Promise.all(updatePromises);
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    throw new Error(error.message || 'Failed to mark all notifications as read');
  }
};

export const createNotification = async (
  vendorId: string,
  title: string,
  message: string,
  type: Notification['type']
): Promise<string> => {
  try {
    const notificationRef = await addDoc(collection(db, 'notifications'), {
      vendorId,
      title,
      message,
      type,
      isRead: false,
      createdAt: serverTimestamp()
    });

    return notificationRef.id;
  } catch (error: any) {
    console.error('Create notification error:', error);
    throw new Error(error.message || 'Failed to create notification');
  }
};

// Helper functions for creating specific notification types
export const createOrderNotification = async (vendorId: string, orderDetails: string, orderId?: string): Promise<string> => {
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    vendorId,
    title: 'New Order Received',
    message: `You have received a new order for ${orderDetails}`,
    type: 'order',
    isRead: false,
    createdAt: serverTimestamp(),
    metadata: orderId ? { orderId } : undefined
  });
  return notificationRef.id;
};

export const createProductApprovedNotification = async (vendorId: string, productName: string, productId?: string): Promise<string> => {
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    vendorId,
    title: 'Product Approved',
    message: `Your product "${productName}" has been approved and is now live`,
    type: 'approved',
    isRead: false,
    createdAt: serverTimestamp(),
    metadata: productId ? { productId } : undefined
  });
  return notificationRef.id;
};

export const createProductRejectedNotification = async (vendorId: string, productName: string, reason?: string, productId?: string): Promise<string> => {
  const message = reason 
    ? `Your product "${productName}" was rejected. Reason: ${reason}`
    : `Your product "${productName}" was rejected. Please review and resubmit`;
  
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    vendorId,
    title: 'Product Rejected',
    message,
    type: 'rejected',
    isRead: false,
    createdAt: serverTimestamp(),
    metadata: productId ? { productId } : undefined
  });
  return notificationRef.id;
};

export const createPayoutProcessedNotification = async (vendorId: string, amount: number, payoutId?: string): Promise<string> => {
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    vendorId,
    title: 'Payout Processed',
    message: `Your payout of ₹${amount.toLocaleString()} has been processed and will be credited to your account`,
    type: 'payout',
    isRead: false,
    createdAt: serverTimestamp(),
    metadata: payoutId ? { payoutId } : undefined
  });
  return notificationRef.id;
};

export const createSupportReplyNotification = async (vendorId: string, ticketSubject: string): Promise<string> => {
  return createNotification(
    vendorId,
    'Support Ticket Reply',
    `You have received a reply to your support ticket: "${ticketSubject}"`,
    'support'
  );
};

export const createReturnNotification = async (vendorId: string, productName: string, returnId?: string): Promise<string> => {
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    vendorId,
    title: 'Return Request',
    message: `A customer has requested a return for "${productName}"`,
    type: 'return',
    isRead: false,
    createdAt: serverTimestamp(),
    metadata: returnId ? { returnId } : undefined
  });
  return notificationRef.id;
};

export const createReviewNotification = async (vendorId: string, productName: string, rating: number, reviewId?: string): Promise<string> => {
  const notificationRef = await addDoc(collection(db, 'notifications'), {
    vendorId,
    title: 'New Review',
    message: `Your product "${productName}" received a ${rating}-star review`,
    type: 'review',
    isRead: false,
    createdAt: serverTimestamp(),
    metadata: reviewId ? { reviewId } : undefined
  });
  return notificationRef.id;
};

export const createSystemNotification = async (vendorId: string, title: string, message: string): Promise<string> => {
  return createNotification(vendorId, title, message, 'system');
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
    // Note: We mark as read instead of deleting to maintain audit trail
    // If you want actual deletion, use: await deleteDoc(notificationRef);
  } catch (error: any) {
    console.error('Delete notification error:', error);
    throw new Error(error.message || 'Failed to delete notification');
  }
};
