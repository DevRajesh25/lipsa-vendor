import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminSDKAvailable } from '@/lib/firebase-admin';
import { createNotification } from '@/services/notificationService';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { status, trackingInfo } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    if (!isAdminSDKAvailable()) {
      return NextResponse.json({ error: 'Firebase Admin SDK not configured' }, { status: 500 });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const updateData: any = {
      orderStatus: status,
      updatedAt: new Date()
    };

    // Add tracking information if provided
    if (trackingInfo) {
      if (trackingInfo.trackingNumber) updateData.trackingNumber = trackingInfo.trackingNumber;
      if (trackingInfo.shippingCarrier) updateData.shippingCarrier = trackingInfo.shippingCarrier;
      if (trackingInfo.trackingUrl) updateData.trackingUrl = trackingInfo.trackingUrl;
    }

    await orderRef.update(updateData);

    // Get order data to send notifications
    const orderDoc = await orderRef.get();
    if (orderDoc.exists) {
      const orderData = orderDoc.data();
      
      // Create notifications for vendors based on status change
      try {
        const notificationPromises = orderData.vendors.map(async (vendorId: string) => {
          let title = '';
          let message = '';
          
          switch (status) {
            case 'processing':
              title = 'Order Being Processed';
              message = `Order #${orderId.slice(-8)} is now being processed`;
              break;
            case 'shipped':
              title = 'Order Shipped';
              message = trackingInfo?.trackingNumber 
                ? `Order #${orderId.slice(-8)} has been shipped. Tracking: ${trackingInfo.trackingNumber}`
                : `Order #${orderId.slice(-8)} has been shipped`;
              break;
            case 'delivered':
              title = 'Order Delivered';
              message = `Order #${orderId.slice(-8)} has been delivered successfully`;
              break;
            case 'cancelled':
              title = 'Order Cancelled';
              message = `Order #${orderId.slice(-8)} has been cancelled`;
              break;
            default:
              return; // No notification for other statuses
          }
          
          if (title && message) {
            return createNotification(vendorId, title, message, 'order');
          }
        });

        await Promise.all(notificationPromises.filter(Boolean));
      } catch (notificationError) {
        console.error('Failed to send order status notifications:', notificationError);
        // Don't fail the status update if notifications fail
      }
    }

    return NextResponse.json({ success: true, message: 'Order status updated successfully' });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}