import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

async function fixMissingVendorStats() {
  console.log('🔍 Checking for vendors without stats documents...\n');
  
  try {
    // Get all vendors
    const vendorsSnapshot = await db.collection('vendors').get();
    const vendors = vendorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log(`Found ${vendors.length} vendors`);
    
    let missingStatsCount = 0;
    let fixedCount = 0;
    
    for (const vendor of vendors) {
      // Check if vendor stats document exists
      const statsDoc = await db.collection('vendorStats').doc(vendor.id).get();
      
      if (!statsDoc.exists) {
        console.log(`❌ Missing stats for vendor: ${vendor.storeName || vendor.businessName || vendor.id}`);
        missingStatsCount++;
        
        try {
          // Create empty stats document
          await db.collection('vendorStats').doc(vendor.id).set({
            totalEarnings: 0,
            availableBalance: 0,
            pendingPayouts: 0,
            completedPayouts: 0,
            totalOrders: 0,
            totalProducts: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            lastUpdated: new Date()
          });
          console.log(`✅ Initialized stats for vendor: ${vendor.storeName || vendor.businessName || vendor.id}`);
          fixedCount++;
        } catch (error) {
          console.error(`❌ Failed to initialize stats for vendor ${vendor.id}:`, error);
        }
      } else {
        console.log(`✅ Stats exist for vendor: ${vendor.storeName || vendor.businessName || vendor.id}`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Total vendors: ${vendors.length}`);
    console.log(`Missing stats: ${missingStatsCount}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Failed: ${missingStatsCount - fixedCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing vendor stats:', error);
  }
}

// Run the script
fixMissingVendorStats()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });