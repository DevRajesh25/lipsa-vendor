import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Firebase config (you'll need to add your config)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testDashboardData() {
  try {
    console.log('Testing dashboard data...');
    
    // Check if there are any vendors
    const vendorsSnapshot = await getDocs(collection(db, 'users'));
    const vendors = (vendorsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() })) as any[])
      .filter(user => user.role === 'vendor');
    
    console.log(`Found ${vendors.length} vendors`);
    
    if (vendors.length > 0) {
      const testVendor = vendors[0];
      console.log('Testing with vendor:', testVendor.id, testVendor.storeName);
      
      // Check products
      const productsQuery = query(
        collection(db, 'products'),
        where('vendorId', '==', testVendor.id)
      );
      const productsSnapshot = await getDocs(productsQuery);
      console.log(`Vendor has ${productsSnapshot.size} products`);
      
      // Check orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('vendors', 'array-contains', testVendor.id)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      console.log(`Vendor has ${ordersSnapshot.size} orders`);
      
      // Check vendor stats
      const statsSnapshot = await getDocs(collection(db, 'vendorStats'));
      console.log(`Found ${statsSnapshot.size} vendor stats documents`);
      
      if (ordersSnapshot.size > 0) {
        console.log('Sample order:', ordersSnapshot.docs[0].data());
      }
    }
    
  } catch (error) {
    console.error('Error testing dashboard data:', error);
  }
}

testDashboardData();