/**
 * Example script showing how to update vendor stats when orders are created/updated
 * This should be integrated into your order creation/update logic
 */

import { doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Call this when a new order is created
export async function onOrderCreated(
  vendorId: string,
  vendorEarnings: number,
  orderTotal: number
) {
  const statsRef = doc(db, 'vendorStats', vendorId);
  
  await updateDoc(statsRef, {
    totalOrders: increment(1),
    pendingOrders: increment(1),
    totalEarnings: increment(vendorEarnings),
    availableBalance: increment(vendorEarnings),
    totalRevenue: increment(orderTotal),
    lastUpdated: Timestamp.now()
  });
}

// Call this when order status changes
export async function onOrderStatusChanged(
  vendorId: string,
  oldStatus: string,
  newStatus: string
) {
  const statsRef = doc(db, 'vendorStats', vendorId);
  const updates: any = {
    lastUpdated: Timestamp.now()
  };

  // Decrement old status
  if (oldStatus === 'pending' || oldStatus === 'processing') {
    updates.pendingOrders = increment(-1);
  } else if (oldStatus === 'delivered' || oldStatus === 'completed') {
    updates.completedOrders = increment(-1);
  }

  // Increment new status
  if (newStatus === 'pending' || newStatus === 'processing') {
    updates.pendingOrders = increment(1);
  } else if (newStatus === 'delivered' || newStatus === 'completed') {
    updates.completedOrders = increment(1);
  }

  await updateDoc(statsRef, updates);
}

// Call this when a payout is requested
export async function onPayoutRequested(vendorId: string, amount: number) {
  const statsRef = doc(db, 'vendorStats', vendorId);
  
  await updateDoc(statsRef, {
    pendingPayouts: increment(amount),
    availableBalance: increment(-amount),
    lastUpdated: Timestamp.now()
  });
}

// Call this when a payout is completed
export async function onPayoutCompleted(vendorId: string, amount: number) {
  const statsRef = doc(db, 'vendorStats', vendorId);
  
  await updateDoc(statsRef, {
    pendingPayouts: increment(-amount),
    completedPayouts: increment(amount),
    lastUpdated: Timestamp.now()
  });
}

// Call this when a payout is rejected
export async function onPayoutRejected(vendorId: string, amount: number) {
  const statsRef = doc(db, 'vendorStats', vendorId);
  
  await updateDoc(statsRef, {
    pendingPayouts: increment(-amount),
    availableBalance: increment(amount),
    lastUpdated: Timestamp.now()
  });
}
