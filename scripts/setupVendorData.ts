/**
 * Setup Script for Vendor Firebase Data
 * 
 * This script helps initialize sample data for testing the vendor panel.
 * Run this after setting up Firebase to create test vendors, products, and orders.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config - replace with your actual config
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

async function setupVendorData() {
  try {
    console.log('🚀 Starting vendor data setup...\n');

    // 1. Create test vendor
    console.log('📝 Creating test vendor...');
    const vendorEmail = 'testvendor@example.com';
    const vendorPassword = 'Test123456';
    
    let vendorId: string;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        vendorEmail,
        vendorPassword
      );
      vendorId = userCredential.user.uid;
      console.log(`✅ Vendor created with ID: ${vendorId}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  Vendor already exists, using existing account');
        // You'll need to manually get the vendor ID from Firebase Console
        vendorId = 'REPLACE_WITH_EXISTING_VENDOR_ID';
      } else {
        throw error;
      }
    }

    // 2. Create vendor document
    console.log('\n📝 Creating vendor document...');
    await setDoc(doc(db, 'users', vendorId), {
      uid: vendorId,
      email: vendorEmail,
      role: 'vendor',
      storeName: 'Test Store',
      storeDescription: 'A test store for development',
      ownerName: 'Test Vendor',
      phone: '+1234567890',
      address: '123 Test Street, Test City',
      status: 'approved', // Set to approved for testing
      bankDetails: {
        accountName: 'Test Vendor',
        accountNumber: '1234567890',
        bankName: 'Test Bank'
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Vendor document created');

    // 3. Create sample products
    console.log('\n📝 Creating sample products...');
    const products = [
      {
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        category: 'Electronics', // Legacy field
        categoryId: 'electronics',
        categorySlug: 'electronics',
        categoryName: 'Electronics',
        price: 99.99,
        stock: 50,
        images: ['https://via.placeholder.com/400'],
        status: 'approved',
        vendorId
      },
      {
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with health tracking',
        category: 'Electronics', // Legacy field
        categoryId: 'electronics',
        categorySlug: 'electronics',
        categoryName: 'Electronics',
        price: 199.99,
        stock: 30,
        images: ['https://via.placeholder.com/400'],
        status: 'pending',
        vendorId
      },
      {
        name: 'Laptop Bag',
        description: 'Durable laptop bag with multiple compartments',
        category: 'Accessories', // Legacy field
        categoryId: 'accessories',
        categorySlug: 'accessories',
        categoryName: 'Accessories',
        price: 49.99,
        stock: 100,
        images: ['https://via.placeholder.com/400'],
        status: 'approved',
        vendorId
      }
    ];

    const productIds: string[] = [];
    for (const product of products) {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      productIds.push(docRef.id);
      console.log(`✅ Product created: ${product.name} (${docRef.id})`);
    }

    // 4. Create sample orders
    console.log('\n📝 Creating sample orders...');
    const orders = [
      {
        customerId: 'customer123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerAddress: '123 Main St, City, State',
        customerPhone: '+1234567890',
        vendors: [vendorId], // Array of vendor IDs
        products: [
          {
            productId: productIds[0],
            vendorId: vendorId,
            name: 'Wireless Headphones',
            price: 99.99,
            quantity: 2,
            image: 'https://via.placeholder.com/400'
          }
        ],
        totalAmount: 199.98,
        commission: 19.99,
        vendorAmount: 179.99,
        vendorEarnings: {
          [vendorId]: 179.99
        },
        vendorCommissions: {
          [vendorId]: 19.99
        },
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        isPaidOut: false,
        paidOutVendors: [],
        stockUpdatesApplied: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        customerId: 'customer456',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerAddress: '456 Oak Ave, City, State',
        customerPhone: '+0987654321',
        vendors: [vendorId], // Array of vendor IDs
        products: [
          {
            productId: productIds[2],
            vendorId: vendorId,
            name: 'Laptop Bag',
            price: 49.99,
            quantity: 1,
            image: 'https://via.placeholder.com/400'
          }
        ],
        totalAmount: 49.99,
        commission: 4.99,
        vendorAmount: 45.00,
        vendorEarnings: {
          [vendorId]: 45.00
        },
        vendorCommissions: {
          [vendorId]: 4.99
        },
        orderStatus: 'processing',
        paymentStatus: 'paid',
        isPaidOut: false,
        paidOutVendors: [],
        stockUpdatesApplied: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        customerId: 'customer789',
        customerName: 'Bob Johnson',
        customerEmail: 'bob@example.com',
        customerAddress: '789 Pine St, City, State',
        customerPhone: '+1122334455',
        vendors: [vendorId], // Array of vendor IDs
        products: [
          {
            productId: productIds[0],
            vendorId: vendorId,
            name: 'Wireless Headphones',
            price: 99.99,
            quantity: 1,
            image: 'https://via.placeholder.com/400'
          }
        ],
        totalAmount: 99.99,
        commission: 9.99,
        vendorAmount: 90.00,
        vendorEarnings: {
          [vendorId]: 90.00
        },
        vendorCommissions: {
          [vendorId]: 9.99
        },
        orderStatus: 'pending',
        paymentStatus: 'paid',
        isPaidOut: false,
        paidOutVendors: [],
        stockUpdatesApplied: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    for (const order of orders) {
      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log(`✅ Order created: ${docRef.id} for ${order.customerName}`);
    }

    // 5. Create sample payout request
    console.log('\n📝 Creating sample payout request...');
    await addDoc(collection(db, 'payoutRequests'), {
      vendorId,
      amount: 179.99,
      status: 'pending',
      bankDetails: {
        accountName: 'Test Vendor',
        accountNumber: '1234567890',
        bankName: 'Test Bank'
      },
      requestedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    });
    console.log('✅ Payout request created');

    // 6. Initialize vendor stats
    console.log('\n📝 Initializing vendor stats...');
    await setDoc(doc(db, 'vendorStats', vendorId), {
      totalEarnings: 314.99, // Sum of all vendor earnings
      availableBalance: 314.99, // Available for payout
      pendingPayouts: 0,
      completedPayouts: 0,
      totalOrders: 3,
      totalProducts: 3,
      pendingOrders: 1,
      completedOrders: 1,
      totalRevenue: 349.96, // Sum of all order totals
      lastUpdated: Timestamp.now()
    });
    console.log('✅ Vendor stats initialized');

    console.log('\n✨ Setup complete!');
    console.log('\n📋 Test Credentials:');
    console.log(`   Email: ${vendorEmail}`);
    console.log(`   Password: ${vendorPassword}`);
    console.log(`   Vendor ID: ${vendorId}`);
    console.log('\n🎉 You can now login to the vendor panel!');

  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

// Run the setup
setupVendorData();
