/**
 * Test script for orderService.ts
 * 
 * This script tests the getVendorOrders function to ensure it works correctly
 */

import { getVendorOrders } from '../services/orderService';

async function testOrderService() {
  try {
    console.log('🧪 Testing orderService.getVendorOrders...');
    
    // Test with a sample vendor ID
    const testVendorId = 'test-vendor-123';
    
    console.log(`Fetching orders for vendor: ${testVendorId}`);
    const orders = await getVendorOrders(testVendorId);
    
    console.log(`✅ Success! Found ${orders.length} orders`);
    
    if (orders.length > 0) {
      console.log('Sample order structure:');
      console.log({
        id: orders[0].id,
        customerName: orders[0].customerName,
        totalAmount: orders[0].totalAmount,
        orderStatus: orders[0].orderStatus,
        productsCount: orders[0].products.length
      });
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testOrderService().then(success => {
    if (success) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('💥 Tests failed!');
      process.exit(1);
    }
  });
}

export { testOrderService };