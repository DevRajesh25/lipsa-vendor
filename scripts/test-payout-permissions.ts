/**
 * Test Payout Permissions Script
 * 
 * This script helps debug payout request permission issues
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function testPayoutPermissions() {
  try {
    console.log('🔐 Testing payout permissions...');
    
    // Login as test vendor
    const email = 'testvendor@example.com';
    const password = 'Test123456';
    
    console.log(`📧 Logging in as ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Logged in successfully as ${user.uid}`);
    
    // Test 1: List all payout requests (should work with updated rules)
    console.log('\n📋 Test 1: Listing all payout requests...');
    try {
      const allPayoutsSnapshot = await getDocs(collection(db, 'payoutRequests'));
      console.log(`✅ Found ${allPayoutsSnapshot.size} total payout requests`);
    } catch (error: any) {
      console.log(`❌ Failed to list all payouts: ${error.message}`);
    }
    
    // Test 2: Query vendor's own payout requests
    console.log('\n🔍 Test 2: Querying vendor-specific payout requests...');
    try {
      const vendorPayoutsQuery = query(
        collection(db, 'payoutRequests'),
        where('vendorId', '==', user.uid),
        orderBy('requestedAt', 'desc')
      );
      
      const vendorPayoutsSnapshot = await getDocs(vendorPayoutsQuery);
      console.log(`✅ Found ${vendorPayoutsSnapshot.size} payout requests for vendor ${user.uid}`);
      
      vendorPayoutsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ₹${data.amount} (${data.status})`);
      });
      
    } catch (error: any) {
      console.log(`❌ Failed to query vendor payouts: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
    }
    
    // Test 3: Check user document
    console.log('\n👤 Test 3: Checking user document...');
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (userDoc.size > 0) {
        const userData = userDoc.docs[0].data();
        console.log(`✅ User role: ${userData.role}`);
        console.log(`✅ User status: ${userData.status}`);
        console.log(`✅ Store name: ${userData.storeName}`);
      } else {
        console.log('❌ User document not found');
      }
    } catch (error: any) {
      console.log(`❌ Failed to get user document: ${error.message}`);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
}

testPayoutPermissions();