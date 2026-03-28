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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, PayoutRequest } from '@/lib/types';
import { 
  updateStatsOnPayoutCompleted, 
  updateStatsOnPayoutRejected 
} from './vendorStatsService';
import { notifyVendorOfPayoutProcessed } from './notificationHelpers';

export interface PayoutCalculation {
  totalEarnings: number;
  orderIds: string[];
  orderCount: number;
}

// Calculate payout for specific orders
export const calculatePayoutForOrders = async (
  vendorId: string, 
  orderIds: string[]
): Promise<PayoutCalculation> => {
  try {
    let totalEarnings = 0;
    const validOrderIds: string[] = [];

    for (const orderId of orderIds) {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const order = orderDoc.data() as Order;
        
        // Validate order belongs to vendor and is paid
        if (
          order.vendors.includes(vendorId) && 
          order.paymentStatus === 'paid' &&
          (!order.paidOutVendors || !order.paidOutVendors.includes(vendorId))
        ) {
          // Safely get vendor earnings
          let vendorEarning = 0;
          if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
            vendorEarning = (order.vendorEarnings as { [key: string]: number })[vendorId] || 0;
          }
          
          if (vendorEarning > 0) {
            totalEarnings += vendorEarning;
            validOrderIds.push(orderId);
          }
        }
      }
    }

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      orderIds: validOrderIds,
      orderCount: validOrderIds.length
    };
  } catch (error) {
    console.error('Error calculating payout for orders:', error);
    throw error;
  }
};

// Create payout request with specific orders
export const createPayoutRequestWithOrders = async (
  vendorId: string,
  amount: number,
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  },
  orderIds?: string[]
): Promise<string> => {
  try {
    let finalOrderIds: string[] = [];
    let calculatedAmount = amount;

    if (orderIds && orderIds.length > 0) {
      // Use specific orders
      const calculation = await calculatePayoutForOrders(vendorId, orderIds);
      finalOrderIds = calculation.orderIds;
      calculatedAmount = calculation.totalEarnings;
      
      if (Math.abs(calculatedAmount - amount) > 0.01) {
        throw new Error('Requested amount does not match calculated earnings from selected orders');
      }
    } else {
      // Auto-select unpaid orders up to requested amount
      const ordersQuery = query(
        collection(db, 'orders'),
        where('vendors', 'array-contains', vendorId),
        where('paymentStatus', '==', 'paid'),
        orderBy('createdAt', 'asc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      let runningTotal = 0;
      for (const order of orders) {
        // Skip if already paid out to this vendor
        if (order.paidOutVendors && order.paidOutVendors.includes(vendorId)) {
          continue;
        }

        // Safely get vendor earnings
        let vendorEarning = 0;
        if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
          vendorEarning = (order.vendorEarnings as { [key: string]: number })[vendorId] || 0;
        }
        
        if (runningTotal + vendorEarning <= amount) {
          runningTotal += vendorEarning;
          finalOrderIds.push(order.id);
          
          if (runningTotal >= amount) break;
        }
      }

      if (runningTotal < amount) {
        throw new Error('Insufficient unpaid earnings to fulfill payout request');
      }
      
      calculatedAmount = runningTotal;
    }

    // Create payout request
    const payoutRequest = {
      vendorId,
      amount: calculatedAmount,
      status: 'pending' as const,
      bankDetails,
      ordersPaidOut: finalOrderIds,
      totalOrderAmount: calculatedAmount,
      requestedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'payoutRequests'), payoutRequest);
    return docRef.id;
  } catch (error) {
    console.error('Error creating payout request with orders:', error);
    throw error;
  }
};

// Process payout (admin function)
export const processPayout = async (
  payoutId: string,
  status: 'completed' | 'rejected',
  adminNotes?: string,
  transactionId?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Update payout request
    const payoutRef = doc(db, 'payoutRequests', payoutId);
    const payoutDoc = await getDoc(payoutRef);
    
    if (!payoutDoc.exists()) {
      throw new Error('Payout request not found');
    }

    const payoutData = payoutDoc.data() as PayoutRequest;
    
    const updateData: any = {
      status,
      processedAt: Timestamp.now()
    };

    if (adminNotes) updateData.adminNotes = adminNotes;
    if (transactionId) updateData.transactionId = transactionId;

    batch.update(payoutRef, updateData);

    // If completed, mark orders as paid out
    if (status === 'completed' && payoutData.ordersPaidOut) {
      for (const orderId of payoutData.ordersPaidOut) {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          const orderData = orderDoc.data() as Order;
          const paidOutVendors = orderData.paidOutVendors || [];
          
          if (!paidOutVendors.includes(payoutData.vendorId)) {
            paidOutVendors.push(payoutData.vendorId);
            
            // Check if all vendors for this order have been paid out
            const allVendorsPaid = orderData.vendors.every(vendorId => 
              paidOutVendors.includes(vendorId)
            );

            batch.update(orderRef, {
              paidOutVendors,
              isPaidOut: allVendorsPaid,
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

    await batch.commit();
    
    // Update vendor stats after batch commit
    if (status === 'completed') {
      await updateStatsOnPayoutCompleted(payoutData.vendorId, payoutData.amount);
      
      // Create notification for vendor
      try {
        await notifyVendorOfPayoutProcessed(payoutData.vendorId, payoutData.amount, payoutId);
      } catch (notificationError) {
        console.error('Failed to send payout notification:', notificationError);
        // Don't fail the payout if notification fails
      }
    } else if (status === 'rejected') {
      await updateStatsOnPayoutRejected(payoutData.vendorId, payoutData.amount);
    }
  } catch (error) {
    console.error('Error processing payout:', error);
    throw error;
  }
};

// Get unpaid orders for vendor
export const getUnpaidOrders = async (vendorId: string): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId),
      where('paymentStatus', '==', 'paid'),
      orderBy('createdAt', 'desc')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];

    // Filter out orders where this vendor has already been paid
    return orders.filter(order => 
      !order.paidOutVendors || !order.paidOutVendors.includes(vendorId)
    );
  } catch (error) {
    console.error('Error getting unpaid orders:', error);
    throw error;
  }
};