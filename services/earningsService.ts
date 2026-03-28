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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, PayoutRequest } from '@/lib/types';
import { getVendorStats, updateStatsOnPayoutRequested } from './vendorStatsService';
import { getPlatformSettings } from './settingsService';

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

// Calculate platform commission using dynamic rate from settings
export const calculateCommission = async (totalAmount: number): Promise<number> => {
  const settings = await getPlatformSettings();
  const commissionRate = settings.commissionPercentage / 100;
  return Math.round(totalAmount * commissionRate * 100) / 100;
};

// Calculate vendor earnings after commission using dynamic rate from settings
export const calculateVendorEarnings = async (totalAmount: number): Promise<number> => {
  const commission = await calculateCommission(totalAmount);
  return Math.round((totalAmount - commission) * 100) / 100;
};

// Get vendor earnings summary - Calculate from orders directly
export const getVendorEarnings = async (vendorId: string): Promise<VendorEarnings> => {
  try {
    // Try to get from optimized stats document first
    const stats = await getVendorStats(vendorId);
    
    // If stats document has data, use it
    if (stats.totalEarnings > 0 || stats.availableBalance > 0) {
      return {
        totalEarnings: stats.totalEarnings,
        availableBalance: stats.availableBalance,
        pendingPayouts: stats.pendingPayouts,
        completedPayouts: stats.completedPayouts,
        totalOrders: stats.totalOrders
      };
    }
    
    // Fallback: Calculate directly from orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    
    let totalEarnings = 0;
    let availableBalance = 0;
    
    orders.forEach(order => {
      let vendorEarning = 0;
      
      // Handle both single-vendor and multi-vendor structures
      if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
        vendorEarning = (order.vendorEarnings as { [key: string]: number })[vendorId] || 0;
      } else if (typeof order.vendorEarnings === 'number') {
        if (order.vendorId === vendorId || order.vendors?.includes(vendorId)) {
          vendorEarning = order.vendorEarnings;
        }
      } else if (order.vendorAmount && (order.vendorId === vendorId || order.vendors?.includes(vendorId))) {
        vendorEarning = order.vendorAmount;
      }
      
      if (vendorEarning > 0) {
        totalEarnings += vendorEarning;
        
        // Add to available balance if not paid out yet
        if (!order.paidOutVendors?.includes(vendorId) && !order.isPaidOut) {
          availableBalance += vendorEarning;
        }
      }
    });
    
    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      pendingPayouts: 0,
      completedPayouts: 0,
      totalOrders: orders.length
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

    return orders.map(order => {
      // Safely get vendor earnings
      let vendorEarning = 0;
      let vendorCommission = 0;
      
      if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
        vendorEarning = (order.vendorEarnings as { [key: string]: number })[vendorId] || 0;
      }
      
      if (typeof order.vendorCommissions === 'object' && order.vendorCommissions !== null) {
        vendorCommission = (order.vendorCommissions as { [key: string]: number })[vendorId] || 0;
      }
      
      return {
        orderId: order.id,
        orderDate: order.createdAt,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        vendorEarnings: vendorEarning,
        commission: vendorCommission,
        status: order.paidOutVendors?.includes(vendorId) ? 'Paid Out' : 'Pending'
      };
    });
  } catch (error) {
    console.error('Error getting earnings breakdown:', error);
    throw error;
  }
};

// Create payout request - Track which orders are being paid out
export const createPayoutRequest = async (input: PayoutRequestInput): Promise<string> => {
  try {
    // Get all unpaid orders for this vendor
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', input.vendorId)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    
    // Calculate available balance and collect unpaid order IDs
    let availableBalance = 0;
    const unpaidOrderIds: string[] = [];
    
    orders.forEach(order => {
      let vendorEarning = 0;
      
      // Handle both single-vendor and multi-vendor structures
      if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
        vendorEarning = (order.vendorEarnings as { [key: string]: number })[input.vendorId] || 0;
      } else if (typeof order.vendorEarnings === 'number') {
        if (order.vendorId === input.vendorId || order.vendors?.includes(input.vendorId)) {
          vendorEarning = order.vendorEarnings;
        }
      } else if (order.vendorAmount && (order.vendorId === input.vendorId || order.vendors?.includes(input.vendorId))) {
        vendorEarning = order.vendorAmount;
      }
      
      // Check if not paid out yet
      if (vendorEarning > 0 && !order.paidOutVendors?.includes(input.vendorId) && !order.isPaidOut) {
        availableBalance += vendorEarning;
        unpaidOrderIds.push(order.id);
      }
    });
    
    // Validate vendor has sufficient balance
    if (input.amount > availableBalance) {
      throw new Error(`Insufficient available balance. Available: ₹${availableBalance.toFixed(2)}, Requested: ₹${input.amount.toFixed(2)}`);
    }

    if (input.amount < 100) {
      throw new Error('Minimum payout amount is ₹100');
    }

    // Create payout request with order tracking
    const payoutRequest = {
      vendorId: input.vendorId,
      amount: input.amount,
      status: 'pending' as const,
      bankDetails: input.bankDetails,
      ordersPaidOut: unpaidOrderIds, // Track which orders are being paid
      totalOrderAmount: availableBalance,
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