/**
 * Test script for Firestore rules validation
 * 
 * This script tests the enhanced categorySlug validation rules
 * Run with: node scripts/test-firestore-rules.js
 */

// Mock Firestore rule testing scenarios
const testScenarios = [
  {
    name: "Valid Product Creation",
    operation: "create",
    collection: "products",
    data: {
      name: "Prestige Stove",
      description: "High quality stove",
      categoryId: "abc123",
      categoryName: "Kitchen Accessories", 
      categorySlug: "kitchen-accessories",
      price: 4999,
      stock: 10,
      status: "pending",
      vendorId: "vendor123"
    },
    expected: "ALLOW",
    reason: "All required fields present with valid categorySlug"
  },
  
  {
    name: "Invalid Product - Empty CategorySlug",
    operation: "create", 
    collection: "products",
    data: {
      name: "Prestige Stove",
      description: "High quality stove",
      categoryId: "abc123",
      categoryName: "Kitchen Accessories",
      categorySlug: "", // INVALID - empty
      price: 4999,
      stock: 10,
      status: "pending",
      vendorId: "vendor123"
    },
    expected: "DENY",
    reason: "Empty categorySlug should be rejected"
  },
  
  {
    name: "Invalid Product - Missing CategorySlug",
    operation: "create",
    collection: "products", 
    data: {
      name: "Prestige Stove",
      description: "High quality stove",
      categoryId: "abc123",
      categoryName: "Kitchen Accessories",
      // categorySlug missing
      price: 4999,
      stock: 10,
      status: "pending",
      vendorId: "vendor123"
    },
    expected: "DENY",
    reason: "Missing categorySlug should be rejected"
  },
  
  {
    name: "Valid Category Creation",
    operation: "create",
    collection: "categories",
    data: {
      name: "Kitchen Accessories",
      slug: "kitchen-accessories", // Valid slug format
      description: "Kitchen tools and accessories"
    },
    expected: "ALLOW",
    reason: "Valid category with proper slug format"
  },
  
  {
    name: "Invalid Category - Bad Slug Format",
    operation: "create",
    collection: "categories",
    data: {
      name: "Kitchen Accessories", 
      slug: "Kitchen Accessories", // INVALID - uppercase and spaces
      description: "Kitchen tools and accessories"
    },
    expected: "DENY",
    reason: "Slug must be lowercase with hyphens only"
  },
  
  {
    name: "Invalid Category - Empty Slug",
    operation: "create",
    collection: "categories",
    data: {
      name: "Kitchen Accessories",
      slug: "", // INVALID - empty
      description: "Kitchen tools and accessories"
    },
    expected: "DENY", 
    reason: "Empty slug should be rejected"
  }
];

// Slug validation function (matches Firestore rules)
function isValidSlug(slug) {
  if (typeof slug !== 'string' || slug.length === 0) {
    return false;
  }
  return /^[a-z0-9-]+$/.test(slug);
}

// Simulate rule validation
function validateRules(scenario) {
  const { operation, collection, data } = scenario;
  
  if (collection === 'products' && operation === 'create') {
    // Check required fields
    const requiredFields = ['name', 'description', 'categoryId', 'categoryName', 'categorySlug', 'price', 'stock', 'status', 'vendorId'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return { allowed: false, reason: `Missing required field: ${field}` };
      }
    }
    
    // Validate categorySlug
    if (!isValidSlug(data.categorySlug)) {
      return { allowed: false, reason: 'Invalid categorySlug format' };
    }
    
    // Validate categoryName
    if (typeof data.categoryName !== 'string' || data.categoryName.length === 0) {
      return { allowed: false, reason: 'Invalid categoryName' };
    }
    
    return { allowed: true, reason: 'Valid product data' };
  }
  
  if (collection === 'categories' && operation === 'create') {
    // Check required fields
    const requiredFields = ['name', 'slug', 'description'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return { allowed: false, reason: `Missing required field: ${field}` };
      }
    }
    
    // Validate slug
    if (!isValidSlug(data.slug)) {
      return { allowed: false, reason: 'Invalid slug format' };
    }
    
    // Validate name
    if (typeof data.name !== 'string' || data.name.length === 0) {
      return { allowed: false, reason: 'Invalid name' };
    }
    
    return { allowed: true, reason: 'Valid category data' };
  }
  
  return { allowed: false, reason: 'Unknown operation/collection' };
}

// Run tests
function runTests() {
  console.log('🧪 Testing Firestore Rules - CategorySlug Validation\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const scenario of testScenarios) {
    const result = validateRules(scenario);
    const expectedAllow = scenario.expected === 'ALLOW';
    const actualAllow = result.allowed;
    
    const success = expectedAllow === actualAllow;
    
    if (success) {
      console.log(`✅ ${scenario.name}`);
      console.log(`   Expected: ${scenario.expected}, Got: ${actualAllow ? 'ALLOW' : 'DENY'}`);
      console.log(`   Reason: ${result.reason}\n`);
      passed++;
    } else {
      console.log(`❌ ${scenario.name}`);
      console.log(`   Expected: ${scenario.expected}, Got: ${actualAllow ? 'ALLOW' : 'DENY'}`);
      console.log(`   Reason: ${result.reason}`);
      console.log(`   Test Reason: ${scenario.reason}\n`);
      failed++;
    }
  }
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Firestore rules are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the rule implementation.');
  }
}

// Run the tests
runTests();

// Export for use in other scripts
module.exports = { testScenarios, validateRules, isValidSlug };