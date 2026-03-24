/**
 * Migration Script: Add categorySlug and categoryName to existing products
 * 
 * This script updates all existing products in Firestore to include
 * categorySlug and categoryName fields based on their categoryId.
 * 
 * Run this script once after deploying the category system fix.
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

// Firebase configuration
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

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ productId: string; error: string }>;
}

async function migrateProductCategories(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  console.log('🚀 Starting product category migration...\n');

  try {
    // Get all products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    stats.total = productsSnapshot.size;

    console.log(`📦 Found ${stats.total} products to process\n`);

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const productDoc of productsSnapshot.docs) {
      const productId = productDoc.id;
      const product = productDoc.data();

      try {
        // Check if product already has categorySlug and categoryName
        if (product.categorySlug && product.categoryName) {
          console.log(`⏭️  Skipping ${productId} - already has category fields`);
          stats.skipped++;
          continue;
        }

        // Check if product has categoryId
        if (!product.categoryId) {
          console.log(`⚠️  Skipping ${productId} - no categoryId found`);
          stats.skipped++;
          continue;
        }

        // Fetch category details
        const categoryDoc = await getDoc(doc(db, 'categories', product.categoryId));

        if (!categoryDoc.exists()) {
          console.log(`❌ Error for ${productId} - category ${product.categoryId} not found`);
          stats.errors++;
          stats.errorDetails.push({
            productId,
            error: `Category ${product.categoryId} not found`
          });
          continue;
        }

        const category = categoryDoc.data();

        // Check if category has slug
        if (!category.slug) {
          console.log(`⚠️  Warning for ${productId} - category ${category.name} missing slug`);
          stats.errors++;
          stats.errorDetails.push({
            productId,
            error: `Category ${category.name} missing slug field`
          });
          continue;
        }

        // Add update to batch
        batch.update(productDoc.ref, {
          categorySlug: category.slug,
          categoryName: category.name,
          category: category.name // Update legacy field too
        });

        batchCount++;
        stats.updated++;

        console.log(`✅ Queued ${productId} - ${product.name}`);
        console.log(`   Category: ${category.name} (${category.slug})\n`);

        // Commit batch if we've reached the limit
        if (batchCount >= batchSize) {
          console.log(`💾 Committing batch of ${batchCount} updates...\n`);
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }

      } catch (error: any) {
        console.log(`❌ Error processing ${productId}: ${error.message}\n`);
        stats.errors++;
        stats.errorDetails.push({
          productId,
          error: error.message
        });
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      console.log(`💾 Committing final batch of ${batchCount} updates...\n`);
      await batch.commit();
    }

    console.log('✅ Migration completed!\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  return stats;
}

// Run migration
migrateProductCategories()
  .then((stats) => {
    console.log('📊 Migration Statistics:');
    console.log('========================');
    console.log(`Total products: ${stats.total}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
      console.log('\n❌ Error Details:');
      stats.errorDetails.forEach(({ productId, error }) => {
        console.log(`  - ${productId}: ${error}`);
      });
    }

    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
