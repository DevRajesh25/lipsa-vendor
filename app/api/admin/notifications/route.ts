import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const { vendorId, title, message, type } = await request.json();

    if (!vendorId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, title, message, type' },
        { status: 400 }
      );
    }

    const validTypes = ['order', 'product_approved', 'product_rejected', 'payout_processed', 'support_reply', 'return', 'review', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const notificationId = await createNotification(vendorId, title, message, type);

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully'
    });

  } catch (error: any) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Example usage:
// POST /api/admin/notifications
// {
//   "vendorId": "vendor_uid_here",
//   "title": "New Order Received",
//   "message": "You have received a new order for Baby Toy",
//   "type": "order"
// }