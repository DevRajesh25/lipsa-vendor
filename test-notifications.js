// Test script to check notifications functionality
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');

// Firebase config (you'll need to replace with actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testNotifications() {
  try {
    console.log('Testing notifications collection...');
    
    // Get all notifications
    const notificationsRef = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    
    console.log(`Total notifications in database: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      console.log('\nSample notifications:');
      snapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.title} - ${data.type} (${data.isRead ? 'Read' : 'Unread'})`);
      });
    } else {
      console.log('No notifications found in database');
    }
    
    // Test for a specific vendor (replace with actual vendor ID)
    const testVendorId = 'test-vendor-id';
    const vendorQuery = query(
      notificationsRef,
      where('vendorId', '==', testVendorId),
      orderBy('createdAt', 'desc')
    );
    
    const vendorSnapshot = await getDocs(vendorQuery);
    console.log(`\nNotifications for vendor ${testVendorId}: ${vendorSnapshot.size}`);
    
  } catch (error) {
    console.error('Error testing notifications:', error);
  }
}

testNotifications();