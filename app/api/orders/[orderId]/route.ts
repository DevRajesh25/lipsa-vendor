import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, getOrderById } from '@/services/orderService';

/**
 * GET /api/orders/[orderId] - Get order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    const order = await getOrderById(orderId);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    console.error('Get order API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch order'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[orderId] - Update order status with inventory management
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    const { orderStatus, trackingNumber, shippingCarrier, trackingUrl } = body;
    
    if (!orderStatus) {
      return NextResponse.json({
        success: false,
        error: 'Order status is required'
      }, { status: 400 });
    }

    // Validate order status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json({
        success: false,
        error: `Invalid order status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    const trackingInfo = trackingNumber || shippingCarrier || trackingUrl ? {
      trackingNumber,
      shippingCarrier,
      trackingUrl
    } : undefined;

    await updateOrderStatus(orderId, orderStatus, trackingInfo);

    // Get updated order
    const updatedOrder = await getOrderById(orderId);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${orderStatus}${orderStatus === 'cancelled' ? ' and inventory restored' : ''}`,
      data: updatedOrder
    });

  } catch (error: any) {
    console.error('Update order status API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update order status'
    }, { status: 500 });
  }
}

/**
 * Example PATCH request body:
 * {
 *   "orderStatus": "shipped",
 *   "trackingNumber": "TRK123456789",
 *   "shippingCarrier": "Delhivery",
 *   "trackingUrl": "https://tracking.delhivery.com/TRK123456789"
 * }
 * 
 * For cancellation:
 * {
 *   "orderStatus": "cancelled"
 * }
 */