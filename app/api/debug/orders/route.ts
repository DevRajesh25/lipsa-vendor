import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getVendorOrders, getCustomerOrders } from '@/services/orderService';

/**
 * Debug API endpoint to check orders data
 * GET /api/debug/orders?type=all|vendor|customer&id=vendorId|customerId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const id = searchParams.get('id');

    let orders = [];
    let message = '';

    switch (type) {
      case 'all':
        orders = await getAllOrders();
        message = `Found ${orders.length} total orders in the database`;
        break;
        
      case 'vendor':
        if (!id) {
          return NextResponse.json({
            success: false,
            error: 'Vendor ID is required for vendor orders'
          }, { status: 400 });
        }
        orders = await getVendorOrders(id);
        message = `Found ${orders.length} orders for vendor ${id}`;
        break;
        
      case 'customer':
        if (!id) {
          return NextResponse.json({
            success: false,
            error: 'Customer ID is required for customer orders'
          }, { status: 400 });
        }
        orders = await getCustomerOrders(id);
        message = `Found ${orders.length} orders for customer ${id}`;
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type. Use: all, vendor, or customer'
        }, { status: 400 });
    }

    // Return summary info to avoid large responses
    const orderSummary = orders.map(order => ({
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      vendorId: order.vendorId,
      vendors: order.vendors,
      productCount: order.products.length,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      message,
      count: orders.length,
      orders: orderSummary
    });
  } catch (error: any) {
    console.error('Debug orders API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch orders',
      details: error.stack
    }, { status: 500 });
  }
}

/**
 * Usage examples:
 * 
 * Get all orders:
 * GET /api/debug/orders?type=all
 * 
 * Get vendor orders:
 * GET /api/debug/orders?type=vendor&id=VENDOR_UID
 * 
 * Get customer orders:
 * GET /api/debug/orders?type=customer&id=CUSTOMER_UID
 */