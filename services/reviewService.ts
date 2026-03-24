import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Review } from '@/lib/types';

export const getVendorReviews = async (vendorId: string): Promise<Review[]> => {
  try {
    // First get all products for this vendor
    const productsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productIds = productsSnapshot.docs.map(doc => doc.id);

    if (productIds.length === 0) {
      return [];
    }

    // Firebase IN operator supports max 30 values, so we need to batch the queries
    const allReviews: Review[] = [];
    const batchSize = 30;
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', 'in', batch),
        orderBy('createdAt', 'desc')
      );

      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      const batchReviews = reviewsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productId: data.productId,
          productName: data.productName,
          customerId: data.customerId,
          customerName: data.customerName,
          rating: data.rating,
          comment: data.comment,
          vendorReply: data.vendorReply,
          createdAt: data.createdAt?.toDate() || new Date()
        } as Review;
      });
      
      allReviews.push(...batchReviews);
    }

    // Sort all reviews by creation date (newest first)
    return allReviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error: any) {
    console.error('Get vendor reviews error:', error);
    throw new Error(error.message || 'Failed to fetch reviews');
  }
};

export const replyToReview = async (
  reviewId: string,
  reply: string
): Promise<void> => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      vendorReply: reply,
      repliedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Reply to review error:', error);
    throw new Error(error.message || 'Failed to reply to review');
  }
};
