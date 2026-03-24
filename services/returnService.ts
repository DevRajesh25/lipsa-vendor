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
import { Return } from '@/lib/types';

export const getVendorReturns = async (vendorId: string): Promise<Return[]> => {
  try {
    const q = query(
      collection(db, 'returns'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: data.orderId || '',
        customerId: data.customerId || '',
        customerName: data.customerName || 'Unknown Customer',
        vendorId: data.vendorId || '',
        productId: data.productId || '',
        productName: data.productName || 'Unknown Product',
        reason: data.reason || 'No reason provided',
        status: data.status || 'pending',
        amount: data.amount || 0,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Return;
    });
  } catch (error: any) {
    console.error('Get vendor returns error:', error);
    throw new Error(error.message || 'Failed to fetch returns');
  }
};

export const updateReturnStatus = async (
  returnId: string,
  status: Return['status']
): Promise<void> => {
  try {
    const returnRef = doc(db, 'returns', returnId);
    await updateDoc(returnRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Update return status error:', error);
    throw new Error(error.message || 'Failed to update return status');
  }
};
