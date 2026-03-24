import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, PayoutRequest } from '@/lib/types';
import { getVendorStats, updateStatsOnPayoutRequested } from './vendorStatsService';

export interface VendorEarnings {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  completedPayouts: number;
  totalOrders: number;
}

export interface EarningsBreakdown {
  orderId: string;
  orderDate: Date;
  customerName: string;
  totalAmount: number;
  vendorEarnings: number;
  commission: number;
  status: string;
}

export interface PayoutRequestInput {
  vendorId: string;
  amount: number;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

// Calculate platform commission (default 10%)
export const calculateCommission = (totalAmount: number, commissionRate: number = 0.10): number => {
  return Math.round(totalAmount * commissionRate * 100) / 100;
};

// Calculate vendor earnings after commission
export const calculateVendorEarnings = (totalAmount: number, commissionRate: number = 0.10): number => {
  const commission = calculateCommission(totalAmount, commissionRate);
  return Math.round((totalAmount - commission) * 100) / 100;
};

// Get vendor earnings summary - OPTIMIZED using stats document
export const getVendorEarnings = async (vendorId: string): Promise<VendorEarnings> => {
  try {
    // Fetch from optimized stats document (single read)
    const stats = await getVendorStats(vendorId);
    
    return {
      totalEarnings: stats.totalEarnings,
      availableBalance: stats.availableBalance,
      pendingPayouts: stats.pendingPayouts,
      completedPayouts: stats.completedPayouts,
      totalOrders: stats.totalOrders
    };
  } catch (error) {
    console.error('Error getting vendor earnings:', error);
    throw error;
  }
};

// Get detailed earnings breakdown
export const getEarningsBreakdown = async (vendorId: string): Promise<EarningsBreakdown[]> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId),
      where('paymentStatus', '==', 'paid'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];

    return orders.map(order => ({
      orderId: order.id,
      orderDate: order.createdAt,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      vendorEarnings: order.vendorEarnings?.[vendorId] || 0,
      commission: order.vendorCommissions?.[vendorId] || 0,
      status: order.paidOutVendors?.includes(vendorId) ? 'Paid Out' : 'Pending'
    }));
  } catch (error) {
    console.error('Error getting earnings breakdown:', error);
    throw error;
  }
};

// Create payout request - OPTIMIZED with stats update
export const createPayoutRequest = async (input: PayoutRequestInput): Promise<string> => {
  try {
    // Validate vendor has sufficient balance
    const earnings = await getVendorEarnings(input.vendorId);
    
    if (input.amount > earnings.availableBalance) {
      throw new Error('Insufficient available balance for payout request');
    }

    if (input.amount < 100) { // Minimum payout amount
      throw new Error('Minimum payout amount is ₹100');
    }

    // Create payout request
    const payoutRequest = {
      vendorId: input.vendorId,
      amount: input.amount,
      status: 'pending' as const,
      bankDetails: input.bankDetails,
      requestedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'payoutRequests'), payoutRequest);
    
    // Update vendor stats
    await updateStatsOnPayoutRequested(input.vendorId, input.amount);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating payout request:', error);
    throw error;
  }
};

// Get vendor payout requests
export const getVendorPayoutRequests = async (vendorId: string): Promise<PayoutRequest[]> => {
  try {
    console.log('Fetching payout requests for vendor:', vendorId);
    
    const payoutQuery = query(
      collection(db, 'payoutRequests'),
      where('vendorId', '==', vendorId),
      orderBy('requestedAt', 'desc')
    );
    
    console.log('Executing payout query...');
    const payoutSnapshot = await getDocs(payoutQuery);
    
    console.log(`Found ${payoutSnapshot.size} payout requests`);
    
    return payoutSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate(),
      processedAt: doc.data().processedAt?.toDate()
    })) as PayoutRequest[];
  } catch (error: any) {
    console.error('Error getting payout requests:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // If it's a permission error, return empty array instead of throwing
    if (error.code === 'permission-denied') {
      console.warn('Permission denied for payout requests, returning empty array');
      return [];
    }
    
    throw error;
  }
};

// Admin functions for payout management
export const updatePayoutStatus = async (
  payoutId: string, 
  status: 'processing' | 'completed' | 'rejected',
  adminNotes?: string
): Promise<void> => {
  try {
    const payoutRef = doc(db, 'payoutRequests', payoutId);
    const updateData: any = {
      status,
      processedAt: Timestamp.now()
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await updateDoc(payoutRef, updateData);

    // If completed, mark orders as paid out
    if (status === 'completed') {
      const payoutDoc = await getDoc(payoutRef);
      const payoutData = payoutDoc.data() as PayoutRequest;
      
      if (payoutData.ordersPaidOut) {
        // Update orders to mark this vendor as paid out
        for (const orderId of payoutData.ordersPaidOut) {
          const orderRef = doc(db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            const orderData = orderDoc.data() as Order;
            const paidOutVendors = orderData.paidOutVendors || [];
            
            if (!paidOutVendors.includes(payoutData.vendorId)) {
              paidOutVendors.push(payoutData.vendorId);
              
              await updateDoc(orderRef, {
                paidOutVendors,
                [`payoutDetails.${payoutData.vendorId}`]: {
                  payoutRequestId: payoutId,
                  paidAt: Timestamp.now(),
                  amount: payoutData.amount
                }
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating payout status:', error);
    throw error;
  }
};

// Get all payout requests for admin
export const getAllPayoutRequests = async (): Promise<PayoutRequest[]> => {
  try {
    const payoutQuery = query(
      collection(db, 'payoutRequests'),
      orderBy('requestedAt', 'desc')
    );
    
    const payoutSnapshot = await getDocs(payoutQuery);
    return payoutSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate(),
      processedAt: doc.data().processedAt?.toDate()
    })) as PayoutRequest[];
  } catch (error) {
    console.error('Error getting all payout requests:', error);
    throw error;
  }
};