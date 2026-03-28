/**
 * Script to fix completed payouts that don't have ordersPaidOut tracking
 * 
 * This script:
 * 1. Finds all completed payouts without ordersPaidOut
 * 2. Calculates which orders should have been marked as paid
 * 3. Updates those orders with paidOutVendors
 * 
 * Run with: npx ts-node scripts/fix-completed-payouts.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

// Firebase config (use your actual config)
const firebaseConfig = {
  // Add your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixCompletedPayouts() {
  try {
    console.log('Starting payout fix...');
    
    // Get all completed payouts
    const payoutsQuery = query(
      collection(db, 'payoutRequests'),
      where('status', '==', 'completed')
    );
    
    const payoutsSnapshot = await getDocs(payoutsQuery);
    console.log(`Found ${payoutsSnapshot.size} completed payouts`);
    
    for (const payoutDoc of payoutsSnapshot.docs) {
      const payout = payoutDoc.data();
      
      // Skip if already has ordersPaidOut
      if (payout.ordersPaidOut && payout.ordersPaidOut.length > 0) {
        console.log(`Payout ${payoutDoc.id} already has ordersPaidOut, skipping`);
        continue;
      }
      
      console.log(`\nFixing payout ${payoutDoc.id}:`);
      console.log(`- Vendor: ${payout.vendorId}`);
      console.log(`- Amount: ₹${payout.amount}`);
      console.log(`- Requested: ${payout.requestedAt?.toDate()}`);
      
      // Get all orders for this vendor
      const ordersQuery = query(
        collection(db, 'orders'),
        where('vendors', 'array-contains', payout.vendorId)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      console.log(`- Found ${ordersSnapshot.size} orders for vendor`);
      
      // Find unpaid orders up to the payout amount
      let remainingAmount = payout.amount;
      const ordersToPay: string[] = [];
      
      for (const orderDoc of ordersSnapshot.docs) {
        if (remainingAmount <= 0) break;
        
        const order = orderDoc.data();
        
        // Check if already paid out
        if (order.paidOutVendors?.includes(payout.vendorId)) {
          continue;
        }
        
        // Get vendor earning from this order
        let vendorEarning = 0;
        if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
          vendorEarning = order.vendorEarnings[payout.vendorId] || 0;
        } else if (typeof order.vendorEarnings === 'number') {
          if (order.vendorId === payout.vendorId || order.vendors?.includes(payout.vendorId)) {
            vendorEarning = order.vendorEarnings;
          }
        } else if (order.vendorAmount) {
          if (order.vendorId === payout.vendorId || order.vendors?.includes(payout.vendorId)) {
            vendorEarning = order.vendorAmount;
          }
        }
        
        if (vendorEarning > 0) {
          ordersToPay.push(orderDoc.id);
          remainingAmount -= vendorEarning;
          console.log(`  - Order ${orderDoc.id}: ₹${vendorEarning}`);
        }
      }
      
      if (ordersToPay.length === 0) {
        console.log('  No orders to mark as paid');
        continue;
      }
      
      console.log(`  Marking ${ordersToPay.length} orders as paid out...`);
      
      // Update orders in batch
      const batch = writeBatch(db);
      
      for (const orderId of ordersToPay) {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDocs(query(collection(db, 'orders'), where('__name__', '==', orderId)));
        
        if (!orderDoc.empty) {
          const orderData = orderDoc.docs[0].data();
          const paidOutVendors = orderData.paidOutVendors || [];
          
          if (!paidOutVendors.includes(payout.vendorId)) {
            paidOutVendors.push(payout.vendorId);
            
            batch.update(orderRef, {
              paidOutVendors,
              [`payoutDetails.${payout.vendorId}`]: {
                payoutRequestId: payoutDoc.id,
                paidAt: payout.processedAt,
                amount: payout.amount
              }
            });
          }
        }
      }
      
      // Update payout with ordersPaidOut
      batch.update(doc(db, 'payoutRequests', payoutDoc.id), {
        ordersPaidOut: ordersToPay
      });
      
      await batch.commit();
      console.log(`  ✓ Fixed payout ${payoutDoc.id}`);
    }
    
    console.log('\n✓ All completed payouts fixed!');
  } catch (error) {
    console.error('Error fixing payouts:', error);
  }
}

// Run the fix
fixCompletedPayouts();
