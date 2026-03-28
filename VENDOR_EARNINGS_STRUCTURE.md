# Vendor Earnings Data Structure

## Firestore Order Document Structure

The system now supports **both single-vendor and multi-vendor** order structures:

### Single-Vendor Order (Current Structure in Database)
```javascript
{
  orderId: "abc123",
  vendorId: "Y0vX7rXOq7OpFJ6mpTOsTy8gmmM2",
  vendors: ["Y0vX7rXOq7OpFJ6mpTOsTy8gmmM2"],
  totalPrice: 354,
  totalAmount: 354,
  taxAmount: 54,
  vendorEarnings: 270,  // ← Single number (product price - commission)
  commission: 30,
  paymentStatus: "paid",
  orderStatus: "pending",
  isPaidOut: false
}
```

### Multi-Vendor Order (Future Support)
```javascript
{
  orderId: "xyz789",
  vendors: ["vendor1", "vendor2"],
  totalAmount: 1062,
  vendorEarnings: {      // ← Object with vendorId keys
    "vendor1": 450,
    "vendor2": 360
  },
  vendorCommissions: {
    "vendor1": 50,
    "vendor2": 40
  },
  paymentStatus: "paid",
  orderStatus: "delivered"
}
```

## Code Implementation

### Updated Order Type
```typescript
export interface Order {
  vendorEarnings?: number | { [vendorId: string]: number };
  // Can be either:
  // - number (single vendor): 270
  // - object (multi-vendor): { "vendorId": 270 }
}
```

### Earnings Calculation Logic

All pages now use this logic to handle both structures:

```javascript
let vendorEarning = 0;

// Check structure type
if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
  // Multi-vendor: get earnings for this vendor
  vendorEarning = order.vendorEarnings[vendor.uid] || 0;
  
} else if (typeof order.vendorEarnings === 'number') {
  // Single-vendor: check if this is the vendor's order
  if (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid)) {
    vendorEarning = order.vendorEarnings;
  }
  
} else if (order.vendorAmount) {
  // Fallback to legacy field
  if (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid)) {
    vendorEarning = order.vendorAmount;
  }
}
```

## Updated Pages

### 1. Earnings Page
**File:** `app/(vendor)/vendor/earnings/page.tsx`

- Fetches orders from Firestore
- Handles both single-vendor (number) and multi-vendor (object) structures
- Displays:
  - Total Sales (product price)
  - Your Earnings (from vendorEarnings)
  - Pending Payout (earnings not paid out)

### 2. Orders Page
**File:** `app/(vendor)/vendor/orders/page.tsx`

- Shows vendor's orders with earnings per order
- Handles both structures in order cards and details modal
- Displays:
  - Product Price
  - Your Earnings

### 3. Dashboard
**File:** `services/dashboardService.ts`

- Calculates total earnings from all orders
- Handles both structures
- Displays: Total Earnings

## Example from Your Database

Based on your Firestore screenshot:

```
Order Document:
├─ totalPrice: 354
├─ totalAmount: 354
├─ taxAmount: 54
├─ vendorEarnings: 270  ← Single number
├─ vendorId: "Y0vX7rXOq7OpFJ6mpTOsTy8gmmM2"
└─ vendors: ["Y0vX7rXOq7OpFJ6mpTOsTy8gmmM2"]

Calculation:
- Product Price: ₹354
- Tax: ₹54
- Commission (10%): ₹35.40
- Vendor Earnings: ₹270 ✓
```

## Benefits

✅ **Backward Compatible**: Works with existing single-vendor orders  
✅ **Future Ready**: Supports multi-vendor orders  
✅ **Flexible**: Handles both number and object structures  
✅ **Fallback**: Uses legacy vendorAmount if needed  
✅ **Type Safe**: TypeScript union type for vendorEarnings  

## Testing

The system will now correctly display earnings from your Firestore database where:
- `vendorEarnings` is stored as a number (270)
- `vendorId` identifies the vendor
- All pages will fetch and display this value correctly
