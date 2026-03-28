/**
 * Firebase Initialization Script
 * 
 * This script helps initialize the Firebase Firestore collections
 * with required initial data for the vendor panel.
 * 
 * Run this script once after setting up Firebase:
 * npx ts-node scripts/initializeFirebase.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration - replace with your actual config
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

async function initializeCollections() {
  try {
    console.log('🚀 Initializing Firebase collections...\n');

    // 1. Initialize platform settings
    console.log('📝 Creating platform settings...');
    await setDoc(doc(db, 'settings', 'platform'), {
      commissionPercentage: 10, // 10% platform commission
      taxPercentage: 18, // 18% GST tax
      currency: 'INR',
      currencySymbol: '₹',
      platformName: 'Multi-Vendor Marketplace',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Platform settings created\n');

    // 2. Create sample categories
    console.log('📝 Creating sample categories...');
    const categories = [
      { id: 'electronics', name: 'Electronics', description: 'Electronic devices and accessories' },
      { id: 'fashion', name: 'Fashion', description: 'Clothing and accessories' },
      { id: 'home', name: 'Home & Living', description: 'Home decor and furniture' },
      { id: 'beauty', name: 'Beauty & Personal Care', description: 'Beauty and personal care products' },
      { id: 'sports', name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' }
    ];

    for (const category of categories) {
      await setDoc(doc(db, 'categories', category.id), {
        name: category.name,
        description: category.description,
        isActive: true,
        createdAt: serverTimestamp()
      });
      console.log(`  ✓ Created category: ${category.name}`);
    }
    console.log('✅ Categories created\n');

    // 3. Instructions for admin account
    console.log('⚠️  IMPORTANT: Admin Account Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('To create an admin account:');
    console.log('1. Go to Firebase Console → Authentication');
    console.log('2. Create a new user with email/password');
    console.log('3. Copy the User UID');
    console.log('4. Go to Firestore Database');
    console.log('5. Create a new document in "admins" collection:');
    console.log('   - Document ID: [paste the User UID]');
    console.log('   - Fields:');
    console.log('     • email: "admin@example.com"');
    console.log('     • role: "admin"');
    console.log('     • createdAt: [current timestamp]');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. Instructions for vendor approval
    console.log('📋 Vendor Approval Process');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('When a vendor registers:');
    console.log('1. A document is created in "vendors" collection');
    console.log('2. Status is set to "pending"');
    console.log('3. Admin must manually approve:');
    console.log('   - Go to Firestore → vendors collection');
    console.log('   - Find the vendor document');
    console.log('   - Change "status" field to "approved"');
    console.log('4. Vendor can now login and access dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ Firebase initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Deploy Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Create admin account (see instructions above)');
    console.log('3. Test vendor registration and approval workflow');
    console.log('4. Configure Cloudinary for product image uploads\n');

  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeCollections()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
