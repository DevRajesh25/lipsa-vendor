/**
 * Test script to demonstrate vendor earnings calculation
 * 
 * Run with: node test-vendor-earnings-calculation.js
 */

// Example order calculation
function calculateVendorEarnings(productPrice, quantity = 1) {
  // Product total (base price)
  const productTotal = productPrice * quantity;
  
  // Tax (18% GST on product price)
  const taxRate = 0.18;
  const tax = Math.round(productTotal * taxRate * 100) / 100;
  
  // Total amount customer pays (product + tax)
  const totalAmount = Math.round((productTotal + tax) * 100) / 100;
  
  // Commission (10% of product price, NOT including tax)
  const commissionRate = 0.10;
  const commission = Math.round(productTotal * commissionRate * 100) / 100;
  
  // Vendor earnings (product price - commission)
  const vendorEarnings = Math.round((productTotal - commission) * 100) / 100;
  
  return {
    productPrice,
    quantity,
    productTotal,
    tax,
    totalAmount,
    commission,
    vendorEarnings,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    payoutStatus: 'pending'
  };
}

// Test case 1: Single product ₹900
console.log('Test Case 1: Product Price ₹900, Quantity 1');
console.log('='.repeat(50));
const result1 = calculateVendorEarnings(900, 1);
console.log(JSON.stringify(result1, null, 2));
console.log('\nBreakdown:');
console.log(`- Customer pays: ₹${result1.totalAmount} (product + tax)`);
console.log(`- Product price: ₹${result1.productTotal}`);
console.log(`- Tax (18% GST): ₹${result1.tax}`);
console.log(`- Commission (10%): ₹${result1.commission}`);
console.log(`- Vendor gets: ₹${result1.vendorEarnings} (product - commission)`);
console.log('');

// Test case 2: Multiple quantity
console.log('Test Case 2: Product Price ₹500, Quantity 2');
console.log('='.repeat(50));
const result2 = calculateVendorEarnings(500, 2);
console.log(JSON.stringify(result2, null, 2));
console.log('\nBreakdown:');
console.log(`- Customer pays: ₹${result2.totalAmount} (product + tax)`);
console.log(`- Product price: ₹${result2.productTotal}`);
console.log(`- Tax (18% GST): ₹${result2.tax}`);
console.log(`- Commission (10%): ₹${result2.commission}`);
console.log(`- Vendor gets: ₹${result2.vendorEarnings} (product - commission)`);
console.log('');

// Test case 3: Higher price product
console.log('Test Case 3: Product Price ₹5000, Quantity 1');
console.log('='.repeat(50));
const result3 = calculateVendorEarnings(5000, 1);
console.log(JSON.stringify(result3, null, 2));
console.log('\nBreakdown:');
console.log(`- Customer pays: ₹${result3.totalAmount} (product + tax)`);
console.log(`- Product price: ₹${result3.productTotal}`);
console.log(`- Tax (18% GST): ₹${result3.tax}`);
console.log(`- Commission (10%): ₹${result3.commission}`);
console.log(`- Vendor gets: ₹${result3.vendorEarnings} (product - commission)`);
console.log('');

console.log('Summary:');
console.log('='.repeat(50));
console.log('✓ Tax (18% GST) is calculated on product price');
console.log('✓ Customer pays: Product Price + Tax');
console.log('✓ Commission (10%) is calculated on product price only');
console.log('✓ Vendor earnings: Product Price - Commission');
console.log('✓ Tax goes to government, not included in vendor earnings');
