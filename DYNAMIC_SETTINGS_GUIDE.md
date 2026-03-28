# Dynamic Settings Guide

## Overview

The platform now supports dynamic commission and tax rates that can be configured by admins through Firestore. This eliminates hardcoded values and allows for flexible business model adjustments.

## What Changed

### 1. Settings Service (`services/settingsService.ts`)
- Created a new service to fetch platform settings from Firestore
- Supports both client-side and server-side (Admin SDK) fetching
- Provides default fallback values if settings don't exist

### 2. Order Creation (`app/api/orders/route.ts`)
- Now fetches commission percentage from Firestore settings
- Calculates vendor earnings dynamically based on current commission rate
- No more hardcoded 10% commission

### 3. Vendor Orders API (`app/api/vendor/orders/route.ts`)
- Fetches commission rate for fallback calculations
- Ensures earnings are calculated correctly even for old orders without vendorEarnings field

### 4. Order Utils (`lib/utils/orderUtils.ts`)
- Tax calculation now uses dynamic tax rate from settings
- Fetches tax percentage from Firestore instead of hardcoded 18%

### 5. Admin Settings Page (`app/admin/settings/page.tsx`)
- New admin UI to manage platform settings
- Real-time calculation preview
- Easy-to-use interface for updating commission and tax rates

### 6. Settings API (`app/api/admin/settings/route.ts`)
- GET endpoint to fetch current settings
- PUT endpoint to update settings
- Validation for percentage values (0-100)

## Firestore Structure

### Collection: `settings`
### Document: `platform`

```json
{
  "commissionPercentage": 10,
  "taxPercentage": 18,
  "currency": "INR",
  "currencySymbol": "₹",
  "platformName": "Multi-Vendor Marketplace",
  "createdAt": "2024-03-28T...",
  "updatedAt": "2024-03-28T..."
}
```

## How to Update Settings

### Option 1: Admin UI (Recommended)
1. Navigate to `/admin/settings`
2. Update commission or tax percentage
3. Click "Save Settings"
4. Changes apply immediately to new orders

### Option 2: Firestore Console
1. Go to Firebase Console → Firestore Database
2. Navigate to `settings` collection → `platform` document
3. Edit `commissionPercentage` or `taxPercentage` fields
4. Save changes

### Option 3: API
```bash
curl -X PUT https://your-domain.com/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "commissionPercentage": 12,
    "taxPercentage": 18
  }'
```

## Calculation Examples

### Example 1: Default Settings (10% commission, 18% tax)
- Product Price: ₹1000
- Tax (18%): ₹180
- Customer Pays: ₹1180
- Commission (10%): ₹100
- Vendor Earnings: ₹900

### Example 2: Updated Settings (12% commission, 15% tax)
- Product Price: ₹1000
- Tax (15%): ₹150
- Customer Pays: ₹1150
- Commission (12%): ₹120
- Vendor Earnings: ₹880

## Important Notes

1. **Existing Orders**: Old orders without `vendorEarnings` field will have earnings calculated on-the-fly using current commission rate
2. **New Orders**: All new orders store `vendorEarnings` map with exact amounts at time of order creation
3. **Tax vs Commission**: 
   - Tax is added to customer's total
   - Commission is deducted from vendor's earnings
   - Vendor earnings = Product Price - Commission (tax is not deducted from vendor)

## Initialization

To initialize settings in a new Firebase project:

```bash
npm run ts-node scripts/initializeFirebase.ts
```

This creates the `settings/platform` document with default values:
- Commission: 10%
- Tax: 18%
- Currency: INR (₹)

## Testing

After updating settings, test with a new order to verify:
1. Tax calculation uses new tax percentage
2. Vendor earnings reflect new commission rate
3. Order totals are calculated correctly
