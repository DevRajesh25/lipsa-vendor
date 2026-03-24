/**
 * Verification Script: Check category system integrity
 * 
 * This script verifies that:
 * 1. All categories have slug fields
 * 2. All products have categorySlug and categoryName
 * 3. Category slugs are valid (lowercase, hyphens only)
 * 4. No duplicate category slugs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

interface VerificationResult {
  categories: {
    total: number;
    withSlug: number;
    withoutSlug: number;
    invalidSlugs: string[];
    duplicateSlugs: string[];
  };
  products: {
    total: number;
    complete: number;
    missingSlug: number;
    missingName: number;
    missingBoth: number;
  };
  issues: string[];
}

function isValidSlug(slug: string): boolean {
  // Slug should be lowercase with hyphens only
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

async function verifyCategories(): Promise<VerificationResult['categories']> {
  console.log('🔍 Verifying categories...\n');

  const categoriesSnapshot = await getDocs(collection(db, 'categories'));
  const slugs = new Map<string, number>();
  const invalidSlugs: string[] = [];

  let withSlug = 0;
  let withoutSlug = 0;

  categoriesSnapshot.docs.forEach(doc => {
    const category = doc.data();
    const slug = category.slug;

    if (slug) {
      withSlug++;
      
      // Check for duplicates
      slugs.set(slug, (slugs.get(slug) || 0) + 1);
      
      // Check if valid
      if (!isValidSlug(slug)) {
        invalidSlugs.push(`${category.name} (${slug})`);
        console.log(`⚠️  Invalid slug: ${category.name} - "${slug}"`);
      } else {
        console.log(`✅ ${category.name} - "${slug}"`);
      }
    } else {
      withoutSlug++;
      console.log(`❌ ${category.name} - MISSING SLUG`);
    }
  });

  const duplicateSlugs = Array.from(slugs.entries())
    .filter(([_, count]) => count > 1)
    .map(([slug, _]) => slug);

  if (duplicateSlugs.length > 0) {
    console.log('\n⚠️  Duplicate slugs found:');
    duplicateSlugs.forEach(slug => console.log(`   - ${slug}`));
  }

  console.log('\n');

  return {
    total: categoriesSnapshot.size,
    withSlug,
    withoutSlug,
    invalidSlugs,
    duplicateSlugs
  };
}

async function verifyProducts(): Promise<VerificationResult['products']> {
  console.log('🔍 Verifying products...\n');

  const productsSnapshot = await getDocs(collection(db, 'products'));

  let complete = 0;
  let missingSlug = 0;
  let missingName = 0;
  let missingBoth = 0;

  productsSnapshot.docs.forEach(doc => {
    const product = doc.data();
    const hasSlug = !!product.categorySlug;
    const hasName = !!product.categoryName;

    if (hasSlug && hasName) {
      complete++;
    } else if (!hasSlug && !hasName) {
      missingBoth++;
      console.log(`❌ ${product.name} - missing both slug and name`);
    } else if (!hasSlug) {
      missingSlug++;
      console.log(`⚠️  ${product.name} - missing slug`);
    } else if (!hasName) {
      missingName++;
      console.log(`⚠️  ${product.name} - missing name`);
    }
  });

  if (complete === productsSnapshot.size) {
    console.log('✅ All products have complete category information\n');
  }

  return {
    total: productsSnapshot.size,
    complete,
    missingSlug,
    missingName,
    missingBoth
  };
}

async function verifyCategorySystem(): Promise<VerificationResult> {
  console.log('🚀 Starting category system verification...\n');
  console.log('==========================================\n');

  const categories = await verifyCategories();
  const products = await verifyProducts();

  const issues: string[] = [];

  // Check for issues
  if (categories.withoutSlug > 0) {
    issues.push(`${categories.withoutSlug} categories missing slug field`);
  }

  if (categories.invalidSlugs.length > 0) {
    issues.push(`${categories.invalidSlugs.length} categories have invalid slugs`);
  }

  if (categories.duplicateSlugs.length > 0) {
    issues.push(`${categories.duplicateSlugs.length} duplicate category slugs found`);
  }

  if (products.missingBoth > 0) {
    issues.push(`${products.missingBoth} products missing both slug and name`);
  }

  if (products.missingSlug > 0) {
    issues.push(`${products.missingSlug} products missing slug`);
  }

  if (products.missingName > 0) {
    issues.push(`${products.missingName} products missing name`);
  }

  return {
    categories,
    products,
    issues
  };
}

// Run verification
verifyCategorySystem()
  .then((result) => {
    console.log('==========================================');
    console.log('📊 Verification Results');
    console.log('==========================================\n');

    console.log('Categories:');
    console.log(`  Total: ${result.categories.total}`);
    console.log(`  With slug: ${result.categories.withSlug}`);
    console.log(`  Without slug: ${result.categories.withoutSlug}`);
    console.log(`  Invalid slugs: ${result.categories.invalidSlugs.length}`);
    console.log(`  Duplicate slugs: ${result.categories.duplicateSlugs.length}\n`);

    console.log('Products:');
    console.log(`  Total: ${result.products.total}`);
    console.log(`  Complete: ${result.products.complete}`);
    console.log(`  Missing slug: ${result.products.missingSlug}`);
    console.log(`  Missing name: ${result.products.missingName}`);
    console.log(`  Missing both: ${result.products.missingBoth}\n`);

    if (result.issues.length === 0) {
      console.log('✅ Category system is healthy!');
      console.log('   All categories and products have correct fields.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Issues found:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Run migration script to fix these issues.\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
