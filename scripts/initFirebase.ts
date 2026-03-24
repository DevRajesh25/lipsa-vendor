/**
 * Firebase Initialization Script
 * 
 * This script helps set up initial Firestore indexes and test data.
 * Run this after setting up your Firebase project.
 * 
 * Usage: npx ts-node scripts/initFirebase.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Replace with your Firebase config
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

async function initializeFirestore() {
  console.log('🚀 Initializing Firestore...');

  try {
    // Create a test vendor (optional)
    console.log('Creating test vendor...');
    const vendorRef = await addDoc(collection(db, 'vendors'), {
      name: 'Test Vendor',
      email: 'test@vendor.com',
      phone: '+1234567890',
      storeName: 'Test Store',
      storeDescription: 'A test store for development',
      createdAt: serverTimestamp()
    });
    console.log('✅ Test vendor created:', vendorRef.id);

    // Create a test product (optional)
    console.log('Creating test product...');
    const productRef = await addDoc(collection(db, 'products'), {
      vendorId: vendorRef.id,
      name: 'Test Product',
      description: 'A test product for development',
      category: 'Electronics',
      price: 99.99,
      stock: 100,
      images: ['https://via.placeholder.com/400'],
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Test product created:', productRef.id);

    console.log('\n✨ Firestore initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Set up Firestore security rules (see FIREBASE_INTEGRATION_GUIDE.md)');
    console.log('2. Set up Firebase Storage rules');
    console.log('3. Create composite indexes if needed');
    console.log('4. Register a vendor account at /vendor/auth/register');

  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
  }
}

// Required Firestore Indexes
console.log('\n📋 Required Firestore Indexes:');
console.log('1. Collection: products');
console.log('   Fields: vendorId (Ascending), createdAt (Descending)');
console.log('\n2. Collection: orders');
console.log('   Fields: vendorId (Ascending), status (Ascending)');
console.log('\nCreate these indexes in Firebase Console > Firestore > Indexes');

// Run initialization
initializeFirestore();
