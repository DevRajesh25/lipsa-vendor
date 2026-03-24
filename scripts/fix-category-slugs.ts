/**
 * Migration script to fix products with empty categorySlug
 * 
 * This script will:
 * 1. Find all products with empty or missing categorySlug
 * 2. Generate categorySlug from categoryName using the slug generation rules
 * 3. Update the products in Firestore
 * 
 * Usage:
 * - Run this script once after deploying the categorySlug fix
 * - Can be run multiple times safely (idempotent)
 */

import { fixProductCategorySlugs, getProductsWithEmptySlug } from '../services/productService';

async function runMigration() {
  try {
    console.log('🚀 Starting categorySlug migration...\n');
    
    // First, check how many products need fixing
    console.log('📊 Checking products with empty categorySlug...');
    const productsWithEmptySlug = await getProductsWithEmptySlug();
    
    if (productsWithEmptySlug.length === 0) {
      console.log('✅ All products already have valid categorySlug. No migration needed.');
      return;
    }
    
    console.log(`Found ${productsWithEmptySlug.length} products with empty categorySlug:`);
    productsWithEmptySlug.forEach(product => {
      console.log(`  - ${product.name} (ID: ${product.id}) - Category: "${product.categoryName || product.category || 'Unknown'}"`);
    });
    
    console.log('\n🔧 Running migration...');
    
    // Run the migration
    const result = await fixProductCategorySlugs();
    
    console.log('\n📈 Migration Results:');
    console.log(`  Total products checked: ${result.totalProducts}`);
    console.log(`  Products fixed: ${result.fixedProducts}`);
    console.log(`  Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (result.fixedProducts > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🎯 All products now have valid categorySlug for homepage filtering.');
    } else {
      console.log('\n✅ No products needed fixing.');
    }
    
  } catch (error: any) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration };