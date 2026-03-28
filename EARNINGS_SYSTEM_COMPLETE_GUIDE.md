# Vendor Earnings System - Complete Guide

## Overview
This document explains how the vendor earnings system works and all the fixes that have been implemented.

## Earnings Calculation

### Formula
```
Product Price: ₹500
Commission (10%): ₹50
Vendor Earnings: ₹450 (Product Price - Commission)

Customer Pays: ₹590 (Product Price + Tax)
Tax (18%): ₹90 (goes to government, not vendor)
```

### Key Points
- ✅ Vendor earnings = Product Price - 10% Commission
- ✅ Tax is separate and NOT included in vendor earnings
- ✅ Commission is hidden from vendor
- ✅ Only paid orders count toward earnings (optional filter)

## System Components

### 1. Order Creation (API)
**File:** `app/api/orders/route.ts`

When an order is created:
```javascript
const productTotal = product.price * product.quantity; // ₹500
const commission = productTotal * 0.1; // ₹50
const vendorEarning = productTotal - commission; // ₹450

// Stored in order:
{
  vendorEarnings: 450,  // Single vendor (number)
  // OR
  vendorEarnings: { "vendorId": 450 },  // Multi-vendor (object)
  vendorCommissions: { "vendorId": 50 }
}
```

### 2. Dashboard
**File:** `app/(vendor)/vendor/dashboard/page.tsx`
**Service:** `services/dashboardService.ts`

Shows:
- Total Earnings: Sum of all vendorEarnings
- Pending Payout: Earnings not yet paid out
- Recent Orders: Last 5 orders with earnings

### 3. Earnings Page
**File:** `app/(vendor)/vendor/earnings/page.tsx`

Shows:
- Total Sales: Sum of product prices
- Your Earnings: Sum of vendorEarnings
- Pending Payout: Earnings not paid out
- Recent Orders: List with earnings per order

### 4. Payout System
**File:** `services/earningsService.ts`

#### Creating Payout Request:
```javascript
// System tracks which orders are being paid
{
  amount: 400,
  ordersPaidOut: ["order1", "order2"],  // ← Tracks orders
  status: "pending"
}
```

#### When Admin Completes Payout:
```javascript
// System marks orders as paid
Order: {
  paidOutVendors: ["vendorId"],  // ← Marks as paid
  payoutDetails: {
    vendorId: {
      payoutRequestId: "xxx",
      paidAt: "2026-03-27",
      amount: 400
    }
  }
}
```

#### Available Balance Calculation:
```javascript
orders.forEach(order => {
  // Only count unpaid orders
  if (!order.paidOutVendors?.includes(vendorId)) {
    availableBalance += order.vendorEarnings;
  }
});
```

## Data Structures

### Order Document (Single Vendor)
```javascript
{
  id: "abc123",
  vendorId: "vendor_uid",
  vendors: ["vendor_uid"],
  products: [{
    productId: "prod_123",
    vendorId: "vendor_uid",
    name: "Fan",
    price: 500,
    quantity: 1
  }],
  totalAmount: 590,  // Customer pays (includes tax)
  taxAmount: 90,
  vendorEarnings: 450,  // ← Number for single vendor
  commissionAmount: 50,
  orderStatus: "delivered",
  paymentStatus: "pending",
  paidOutVendors: [],  // ← Empty = not paid out
  isPaidOut: false
}
```

### Order Document (Multi-Vendor)
```javascript
{
  vendors: ["vendor1", "vendor2"],
  vendorEarnings: {  // ← Object for multi-vendor
    "vendor1": 450,
    "vendor2": 360
  },
  vendorCommissions: {
    "vendor1": 50,
    "vendor2": 40
  },
  paidOutVendors: ["vendor1"]  // ← vendor1 paid, vendor2 not
}
```

### Payout Request Document
```javascript
{
  id: "payout_123",
  vendorId: "vendor_uid",
  amount: 400,
  status: "completed",  // pending | processing | completed | rejected
  bankDetails: {
    accountName: "John Doe",
    accountNumber: "1234567890",
    bankName: "Bank Name"
  },
  ordersPaidOut: ["order1", "order2"],  // ← Tracks which orders
  requestedAt: "2026-03-27",
  processedAt: "2026-03-27"
}
```

## Common Issues & Fixes

### Issue 1: Earnings Showing ₹0
**Cause:** Order doesn't have `vendorEarnings` field

**Fix:** Add to order document:
```javascript
vendorEarnings: 450  // (productPrice - 10% commission)
```

### Issue 2: Payout Completed But Balance Not Reduced
**Cause:** Orders not marked as paid out

**Fix:** Add to order document:
```javascript
paidOutVendors: ["vendorId"]
```

### Issue 3: New Orders Not Showing Earnings
**Cause:** Order creation API not calculating vendorEarnings

**Fix:** Ensure order creation includes:
```javascript
const commission = productTotal * 0.1;
const vendorEarning = productTotal - commission;

orderData.vendorEarnings = vendorEarning;
orderData.commissionAmount = commission;
```

### Issue 4: Dashboard Showing Wrong Totals
**Cause:** Code trying to access vendorEarnings as object when it's a number

**Fix:** Handle both structures:
```javascript
let vendorEarning = 0;

if (typeof order.vendorEarnings === 'object') {
  vendorEarning = order.vendorEarnings[vendorId] || 0;
} else if (typeof order.vendorEarnings === 'number') {
  if (order.vendorId === vendorId) {
    vendorEarning = order.vendorEarnings;
  }
}
```

## Manual Fixes in Firestore

### Fix Missing vendorEarnings:
1. Go to Firestore → `orders` collection
2. Find the order
3. Add field:
   - Name: `vendorEarnings`
   - Type: `number`
   - Value: `(productPrice * quantity) * 0.9`

### Fix Payout Balance:
1. Find orders that were paid out
2. Add field:
   - Name: `paidOutVendors`
   - Type: `array`
   - Value: `["vendorId"]`

### Fix Payout Request:
1. Go to `payoutRequests` collection
2. Find completed payout
3. Add field:
   - Name: `ordersPaidOut`
   - Type: `array`
   - Value: `["orderId1", "orderId2"]`

## Testing Checklist

- [ ] Create new order → vendorEarnings calculated correctly
- [ ] Dashboard shows correct Total Earnings
- [ ] Dashboard shows correct Pending Payout
- [ ] Earnings page shows correct amounts
- [ ] Orders page shows earnings per order
- [ ] Payout request created with ordersPaidOut
- [ ] Admin completes payout → orders marked as paid
- [ ] Available balance reduces after payout
- [ ] New orders add to available balance

## Files Modified

1. `app/api/orders/route.ts` - Order creation with earnings calculation
2. `services/dashboardService.ts` - Dashboard stats calculation
3. `services/earningsService.ts` - Payout and earnings logic
4. `app/(vendor)/vendor/dashboard/page.tsx` - Dashboard display
5. `app/(vendor)/vendor/earnings/page.tsx` - Earnings page
6. `app/(vendor)/vendor/orders/page.tsx` - Orders display
7. `app/(vendor)/vendor/payouts/page.tsx` - Payout requests
8. `lib/types.ts` - Type definitions

## Summary

The earnings system now:
- ✅ Calculates vendor earnings correctly (product price - 10% commission)
- ✅ Handles both single-vendor and multi-vendor orders
- ✅ Tracks which orders are paid out
- ✅ Reduces available balance after payouts
- ✅ Shows accurate earnings across all pages
- ✅ Hides commission from vendor view
- ✅ Separates tax from earnings

All new orders and payouts will work correctly. Old data may need manual fixes in Firestore.
