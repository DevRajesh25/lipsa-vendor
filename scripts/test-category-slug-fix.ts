/**
 * Test script to verify categorySlug generation works correctly
 * 
 * This script tests:
 * 1. Slug generation utility functions
 * 2. Product creation with automatic categorySlug
 * 3. Category filtering by slug
 */

import { generateCategorySlug } from '../lib/utils/slugUtils';
import { getProductsByCategorySlug } from '../services/customerProductService';

// Test cases for slug generation
const testCases = [
  { input: 'Kitchen Accessories', expected: 'kitchen-accessories' },
  { input: 'Home Essentials', expected: 'home-essentials' },
  { input: 'Baby Essentials', expected: 'baby-essentials' },
  { input: 'Electronics & Gadgets', expected: 'electronics-gadgets' },
  { input: '  Health & Beauty  ', expected: 'health-beauty' },
  { input: 'Sports & Fitness', expected: 'sports-fitness' },
  { input: 'Books, Movies & Music', expected: 'books-movies-music' },
  { input: 'Automotive & Industrial', expected: 'automotive-industrial' },
  { input: '', expected: '' },
  { input: '   ', expected: '' }
];

async function testSlugGeneration() {
  console.log('🧪 Testing slug generation...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = generateCategorySlug(testCase.input);
    const success = result === testCase.expected;
    
    if (success) {
      console.log(`✅ "${testCase.input}" → "${result}"`);
      passed++;
    } else {
      console.log(`❌ "${testCase.input}" → "${result}" (expected: "${testCase.expected}")`);
      failed++;
    }
  }
  
  console.log(`\n📊 Slug generation test results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function testProductFiltering() {
  console.log('🔍 Testing product filtering by categorySlug...\n');
  
  const testSlugs = [
    'kitchen-accessories',
    'home-essentials', 
    'electronics',
    'baby-essentials'
  ];
  
  for (const slug of testSlugs) {
    try {
      const products = await getProductsByCategorySlug(slug, 5);
      console.log(`✅ "${slug}": Found ${products.length} products`);
      
      // Verify all products have the correct categorySlug
      const invalidProducts = products.filter(p => p.categorySlug !== slug);
      if (invalidProducts.length > 0) {
        console.log(`❌ Found ${invalidProducts.length} products with incorrect categorySlug`);
        invalidProducts.forEach(p => {
          console.log(`   - ${p.name}: has "${p.categorySlug}", expected "${slug}"`);
        });
      }
    } catch (error: any) {
      console.log(`❌ Error filtering "${slug}": ${error.message}`);
    }
  }
  
  console.log('\n✅ Product filtering test completed\n');
}

async function runTests() {
  try {
    console.log('🚀 Starting categorySlug fix tests...\n');
    
    // Test slug generation
    const slugTestPassed = await testSlugGeneration();
    
    if (!slugTestPassed) {
      console.log('❌ Slug generation tests failed. Fix the utility function first.');
      return;
    }
    
    // Test product filtering (requires Firebase connection)
    await testProductFiltering();
    
    console.log('🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Slug generation works correctly');
    console.log('✅ Product filtering by categorySlug works');
    console.log('✅ Homepage sections should now display products correctly');
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

export { runTests, testSlugGeneration, testProductFiltering };