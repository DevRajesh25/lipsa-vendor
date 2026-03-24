/**
 * Manual Vendor Stats Creation Script
 * 
 * Run this if you need to manually create vendor stats documents
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createVendorStats() {
  try {
    console.log('🔍 Finding vendors...');
    
    // Get all vendors
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'vendor')
    );
    const usersSnapshot = await getDocs(usersQuery);
    const vendors = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    console.log(`Found ${vendors.length} vendors`);
    
    for (const vendor of vendors) {
      console.log(`\n📊 Creating stats for ${vendor.storeName || vendor.email}...`);
      
      // Get vendor's products
      const productsQuery = query(
        collection(db, 'products'),
        where('vendorId', '==', vendor.id)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const totalProducts = productsSnapshot.size;
      
      // Get vendor's orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('vendors', 'array-contains', vendor.id)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Calculate stats
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => 
        o.orderStatus === 'pending' || o.orderStatus === 'processing'
      ).length;
      const completedOrders = orders.filter(o => 
        o.orderStatus === 'delivered' || o.orderStatus === 'completed'
      ).length;
      
      let totalEarnings = 0;
      let availableBalance = 0;
      let totalRevenue = 0;
      
      orders.forEach(order => {
        if (order.paymentStatus === 'paid') {
          const vendorEarning = order.vendorEarnings?.[vendor.id] || 0;
          totalEarnings += vendorEarning;
          
          // Add to available balance if not paid out
          if (!order.paidOutVendors?.includes(vendor.id)) {
            availableBalance += vendorEarning;
          }
        }
        
        // Calculate total revenue from vendor's products
        order.products?.forEach((product: any) => {
          if (product.vendorId === vendor.id) {
            totalRevenue += product.price * product.quantity;
          }
        });
      });
      
      // Create stats document
      await setDoc(doc(db, 'vendorStats', vendor.id), {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        availableBalance: Math.round(availableBalance * 100) / 100,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalOrders,
        totalProducts,
        pendingOrders,
        completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        lastUpdated: Timestamp.now()
      });
      
      console.log(`✅ Stats created for ${vendor.storeName || vendor.email}:`);
      console.log(`   Products: ${totalProducts}`);
      console.log(`   Orders: ${totalOrders}`);
      console.log(`   Earnings: ₹${totalEarnings.toFixed(2)}`);
      console.log(`   Available: ₹${availableBalance.toFixed(2)}`);
    }
    
    console.log('\n🎉 All vendor stats created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating vendor stats:', error);
  }
}

createVendorStats();