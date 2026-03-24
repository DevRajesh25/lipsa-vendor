/**
 * Script to initialize vendorStats documents for all existing vendors
 * This creates optimized stats documents to improve dashboard performance
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!getApps().length) {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Parse the JSON service account key
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Fallback to individual environment variables
    serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };
  }

  initializeApp({
    credential: cert(serviceAccount as any)
  });
}

const db = getFirestore();

async function initializeVendorStats() {
  console.log('🚀 Starting vendor stats initialization...\n');

  try {
    // Get all vendors
    const vendorsSnapshot = await db.collection('vendors').get();
    console.log(`📊 Found ${vendorsSnapshot.size} vendors\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const vendorDoc of vendorsSnapshot.docs) {
      const vendorId = vendorDoc.id;
      const vendorData = vendorDoc.data();
      
      console.log(`Processing vendor: ${vendorData.businessName || vendorId}`);

      try {
        // Get all orders for this vendor
        const ordersSnapshot = await db.collection('orders')
          .where('vendors', 'array-contains', vendorId)
          .get();

        let totalEarnings = 0;
        let totalRevenue = 0;
        let totalOrders = ordersSnapshot.size;
        let pendingOrders = 0;
        let completedOrders = 0;
        let paidOutAmount = 0;

        ordersSnapshot.forEach(orderDoc => {
          const order = orderDoc.data();
          const vendorEarning = order.vendorEarnings?.[vendorId] || 0;
          
          totalEarnings += vendorEarning;
          totalRevenue += order.totalAmount || 0;

          // Count by status
          const status = order.orderStatus || order.status || 'pending';
          if (status === 'pending' || status === 'processing') {
            pendingOrders++;
          } else if (status === 'delivered' || status === 'completed') {
            completedOrders++;
          }

          // Check if paid out
          if (order.paidOutVendors?.includes(vendorId)) {
            paidOutAmount += vendorEarning;
          }
        });

        // Get payout data
        const pendingPayoutsSnapshot = await db.collection('payoutRequests')
          .where('vendorId', '==', vendorId)
          .where('status', 'in', ['pending', 'processing'])
          .get();

        const completedPayoutsSnapshot = await db.collection('payoutRequests')
          .where('vendorId', '==', vendorId)
          .where('status', '==', 'completed')
          .get();

        let pendingPayouts = 0;
        pendingPayoutsSnapshot.forEach(doc => {
          pendingPayouts += doc.data().amount || 0;
        });

        let completedPayouts = 0;
        completedPayoutsSnapshot.forEach(doc => {
          completedPayouts += doc.data().amount || 0;
        });

        // Get product count
        const productsSnapshot = await db.collection('products')
          .where('vendorId', '==', vendorId)
          .get();

        const totalProducts = productsSnapshot.size;

        // Calculate available balance
        const availableBalance = totalEarnings - paidOutAmount - pendingPayouts;

        // Create stats document
        const statsData = {
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          availableBalance: Math.max(0, Math.round(availableBalance * 100) / 100),
          pendingPayouts: Math.round(pendingPayouts * 100) / 100,
          completedPayouts: Math.round(completedPayouts * 100) / 100,
          totalOrders,
          totalProducts,
          pendingOrders,
          completedOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          lastUpdated: FieldValue.serverTimestamp()
        };

        await db.collection('vendorStats').doc(vendorId).set(statsData);

        console.log(`  ✅ Stats created:`);
        console.log(`     - Total Earnings: ₹${statsData.totalEarnings}`);
        console.log(`     - Available Balance: ₹${statsData.availableBalance}`);
        console.log(`     - Total Orders: ${totalOrders}`);
        console.log(`     - Total Products: ${totalProducts}\n`);

        successCount++;
      } catch (error: any) {
        console.error(`  ❌ Error processing vendor ${vendorId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Successfully initialized: ${successCount} vendors`);
    console.log(`   ❌ Errors: ${errorCount} vendors`);
    console.log('\n✨ Vendor stats initialization complete!');

  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
initializeVendorStats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
