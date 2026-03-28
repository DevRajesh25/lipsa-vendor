import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminSDKAvailable } from '@/lib/firebase-admin';
import { Order } from '@/lib/types';
import { getPlatformSettingsServer } from '@/services/settingsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    if (!isAdminSDKAvailable()) {
      return NextResponse.json({ error: 'Firebase Admin SDK not configured' }, { status: 500 });
    }

    console.log('Fetching orders for vendor:', vendorId);

    // Fetch platform settings for commission calculation
    const settings = await getPlatformSettingsServer(adminDb);
    const commissionRate = settings.commissionPercentage / 100; // Convert percentage to decimal

    // Try both new multi-vendor structure and legacy single-vendor structure
    const queries = [
      // New structure: vendors array contains vendorId
      adminDb.collection('orders')
        .where('vendors', 'array-contains', vendorId)
        .orderBy('createdAt', 'desc'),
      // Legacy structure: vendorId field equals vendorId
      adminDb.collection('orders')
        .where('vendorId', '==', vendorId)
        .orderBy('createdAt', 'desc')
    ];

    const results = await Promise.all(
      queries.map(async (query) => {
        try {
          return await query.get();
        } catch (error) {
          console.warn('Query failed, trying next:', error);
          return null;
        }
      })
    );

    // Combine results from both queries and remove duplicates
    const allDocs = new Map();
    results.forEach(querySnapshot => {
      if (querySnapshot) {
        querySnapshot.docs.forEach((doc: any) => {
          allDocs.set(doc.id, doc);
        });
      }
    });

    console.log(`Found ${allDocs.size} orders for vendor ${vendorId}`);

    if (allDocs.size === 0) {
      console.log('No orders found. Checking if orders collection exists...');
      // Try to get any order to see if collection exists
      const testSnapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').limit(1).get();
      console.log(`Total orders in collection: ${testSnapshot.docs.length}`);
    }

    const orders = Array.from(allDocs.values()).map(doc => {
      const data = doc.data();
      
      // Filter products to show only this vendor's products
      const vendorProducts = (data.products || []).filter(
        (product: any) => product.vendorId === vendorId
      );
      
      // Get vendor-specific earnings from vendorEarnings map
      const vendorEarnings = data.vendorEarnings || {};
      const vendorCommissions = data.vendorCommissions || {};
      
      // Calculate vendor-specific total from products
      const vendorTotal = vendorProducts.reduce(
        (sum: number, product: any) => sum + (product.price * product.quantity), 
        0
      );
      
      // Get vendorAmount from vendorEarnings map, or calculate it if not present
      let vendorAmount = vendorEarnings[vendorId] || 0;
      let vendorCommission = vendorCommissions[vendorId] || 0;
      
      // Fallback: If vendorAmount is 0 but we have products, calculate it
      if (vendorAmount === 0 && vendorTotal > 0) {
        // Calculate commission using dynamic commission rate from settings
        vendorCommission = Math.round(vendorTotal * commissionRate * 100) / 100;
        // Calculate vendor earnings (product total - commission)
        vendorAmount = Math.round((vendorTotal - vendorCommission) * 100) / 100;
        console.log(`Calculated vendorAmount for ${vendorId}: ₹${vendorAmount} (total: ₹${vendorTotal}, commission: ₹${vendorCommission}, rate: ${settings.commissionPercentage}%)`);
      }
      
      // Check if this vendor has been paid out
      const paidOutVendors = data.paidOutVendors || [];
      const isVendorPaidOut = paidOutVendors.includes(vendorId);
      
      return {
        id: doc.id,
        customerId: data.customerId,
        customerName: data.customerName || data.customerEmail || 'Unknown Customer',
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        customerPhone: data.customerPhone,
        vendorId: data.vendorId, // Legacy field
        vendors: data.vendors || [data.vendorId], // Multi-vendor support
        products: vendorProducts, // Only this vendor's products
        totalAmount: vendorTotal, // Vendor-specific total
        commission: vendorCommission,
        vendorAmount: vendorAmount,
        vendorEarnings: data.vendorEarnings,
        vendorCommissions: data.vendorCommissions,
        orderStatus: data.orderStatus || data.status || 'pending',
        paymentStatus: data.paymentStatus || 'pending',
        paymentMethod: data.paymentMethod,
        isPaidOut: isVendorPaidOut, // Vendor-specific payout status
        paidOutVendors: data.paidOutVendors,
        payoutDetails: data.payoutDetails,
        trackingNumber: data.trackingNumber,
        shippingCarrier: data.shippingCarrier,
        trackingUrl: data.trackingUrl,
        stockUpdatesApplied: data.stockUpdatesApplied,
        stockRestored: data.stockRestored,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}