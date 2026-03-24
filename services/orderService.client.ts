import { Order } from '@/lib/types';

/**
 * Client-side order service that uses API routes instead of direct Firebase calls
 * This avoids the "child_process" error from Firebase Admin SDK in client components
 */

export const getVendorOrders = async (vendorId: string): Promise<Order[]> => {
  try {
    const response = await fetch(`/api/vendor/orders?vendorId=${vendorId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch orders');
    }

    const data = await response.json();
    return data.orders.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined
    }));
  } catch (error: any) {
    console.error('Error fetching vendor orders:', error);
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order['orderStatus'],
  trackingInfo?: {
    trackingNumber?: string;
    shippingCarrier?: string;
    trackingUrl?: string;
  }
): Promise<void> => {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, trackingInfo }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update order status');
    }
  } catch (error: any) {
    console.error('Update order status error:', error);
    throw new Error(error.message || 'Failed to update order status');
  }
};

// Additional client-side order functions can be added here as needed
// All should use API routes instead of direct Firebase calls