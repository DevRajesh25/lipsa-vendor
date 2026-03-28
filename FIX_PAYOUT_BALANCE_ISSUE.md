# Fix Payout Balance Issue

## Problem
Vendor requested ₹400 payout, admin marked it as "Paid", but available balance still shows ₹450 instead of ₹50.

## Root Cause
The payout request was created BEFORE the system tracked which orders were being paid out. When admin marked it as "completed", no orders were updated with `paidOutVendors`, so the available balance calculation still includes those orders.

## Solution Options

### Option 1: Manual Firestore Fix (Immediate)

1. **Find the completed payout in Firestore:**
   - Collection: `payoutRequests`
   - Document ID: `1WzfStCm` (from screenshot)
   - Status: `completed`
   - Amount: `400`

2. **Find the vendor's orders:**
   - Collection: `orders`
   - Where: `vendors` array-contains `Y0vX7rXOq7OpFJ6mpTOsTy8gmmM2`

3. **For each order with earnings totaling ₹400:**
   - Add vendor ID to `paidOutVendors` array
   - Example: If order has `vendorEarnings: 270`, add to `paidOutVendors: ["Y0vX7rXOq7OpFJ6mpTOsTy8gmmM2"]`

4. **Update the payout request:**
   - Add field: `ordersPaidOut: ["orderId1", "orderId2"]`

### Option 2: Run Migration Script

```bash
# Install dependencies
npm install

# Run the fix script
npx ts-node scripts/fix-completed-payouts.ts
```

This will automatically:
- Find all completed payouts without `ordersPaidOut`
- Calculate which orders should be marked as paid
- Update orders with `paidOutVendors`
- Update payouts with `ordersPaidOut`

### Option 3: Wait for New Payouts (Future Fix)

The code has been updated. All NEW payout requests will:
1. Track which orders are being paid out
2. Automatically mark orders as paid when admin completes the payout
3. Correctly reduce available balance

**Old payouts** (like the ₹400 one) will continue to show incorrect balance until manually fixed.

## How It Works Now (After Fix)

### When Vendor Requests Payout:
```javascript
// System finds all unpaid orders
Orders: [
  { id: "order1", vendorEarnings: 270, paidOut: false },
  { id: "order2", vendorEarnings: 180, paidOut: false }
]

// Creates payout request
PayoutRequest: {
  amount: 400,
  ordersPaidOut: ["order1", "order2"],  // ← Tracks orders
  status: "pending"
}
```

### When Admin Marks as Completed:
```javascript
// System updates each order
Order1: {
  paidOutVendors: ["vendorId"],  // ← Marks as paid
  payoutDetails: {
    vendorId: {
      payoutRequestId: "1WzfStCm",
      paidAt: "2026-03-27",
      amount: 400
    }
  }
}
```

### Available Balance Calculation:
```javascript
// Excludes paid orders
orders.forEach(order => {
  if (!order.paidOutVendors?.includes(vendorId)) {
    availableBalance += order.vendorEarnings;  // Only unpaid
  }
});

// Result: ₹450 - ₹400 = ₹50 ✓
```

## Verification

After fixing, check:
1. **Payout Request** has `ordersPaidOut` field
2. **Orders** have vendor in `paidOutVendors` array
3. **Available Balance** shows correct amount (₹50)

## Prevention

All future payouts will automatically work correctly. The system now:
- ✅ Tracks orders in payout requests
- ✅ Marks orders as paid when completed
- ✅ Excludes paid orders from available balance
- ✅ Shows accurate balance after payouts
