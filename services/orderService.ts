import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  writeBatch,
  limit,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderProduct, Product } from '@/lib/types';

export const getVendorOrders = async (vendorId: string): Promise<Order[]> => {
  try {
    const response = await fetch(`/api/vendor/orders?vendorId=${vendorId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch orders');
    }

    const data = await response.json();
    
    // Convert Firestore timestamps to Date objects
    return data.orders.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    }));
  } catch (error: any) {
    console.error('Get vendor orders error:', error);
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
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      orderStatus: status,
      updatedAt: new Date()
    };

    if (trackingInfo) {
      if (trackingInfo.trackingNumber) updateData.trackingNumber = trackingInfo.trackingNumber;
      if (trackingInfo.shippingCarrier) updateData.shippingCarrier = trackingInfo.shippingCarrier;
      if (trackingInfo.trackingUrl) updateData.trackingUrl = trackingInfo.trackingUrl;
    }

    await updateDoc(orderRef, updateData);
  } catch (error: any) {
    console.error('Update order status error:', error);
    throw new Error(error.message || 'Failed to update order status');
  }
};

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    console.log('Fetching all orders...');
    
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ordersQuery);
    console.log(`Found ${querySnapshot.size} orders`);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customerId: data.customerId || '',
        customerName: data.customerName || 'Unknown Customer',
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        customerPhone: data.customerPhone,
        vendorId: data.vendorId,
        vendors: data.vendors || [],
        products: data.products || [],
        totalAmount: data.totalAmount || 0,
        commission: data.commission || 0,
        vendorAmount: data.vendorAmount || 0,
        vendorEarnings: data.vendorEarnings || {},
        vendorCommissions: data.vendorCommissions || {},
        orderStatus: data.orderStatus || 'pending',
        paymentStatus: data.paymentStatus || 'pending',
        isPaidOut: data.isPaidOut || false,
        paidOutVendors: data.paidOutVendors || [],
        payoutDetails: data.payoutDetails || {},
        trackingNumber: data.trackingNumber,
        shippingCarrier: data.shippingCarrier,
        trackingUrl: data.trackingUrl,
        stockUpdatesApplied: data.stockUpdatesApplied || false,
        stockRestored: data.stockRestored || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });

    return orders;
  } catch (error: any) {
    console.error('Get all orders error:', error);
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

export const getCustomerOrders = async (customerId: string): Promise<Order[]> => {
  try {
    console.log('Fetching orders for customer:', customerId);
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(ordersQuery);
    console.log(`Found ${querySnapshot.size} orders for customer ${customerId}`);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        customerId: data.customerId || '',
        customerName: data.customerName || 'Unknown Customer',
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        customerPhone: data.customerPhone,
        vendorId: data.vendorId,
        vendors: data.vendors || [],
        products: data.products || [],
        totalAmount: data.totalAmount || 0,
        commission: data.commission || 0,
        vendorAmount: data.vendorAmount || 0,
        vendorEarnings: data.vendorEarnings || {},
        vendorCommissions: data.vendorCommissions || {},
        orderStatus: data.orderStatus || 'pending',
        paymentStatus: data.paymentStatus || 'pending',
        isPaidOut: data.isPaidOut || false,
        paidOutVendors: data.paidOutVendors || [],
        payoutDetails: data.payoutDetails || {},
        trackingNumber: data.trackingNumber,
        shippingCarrier: data.shippingCarrier,
        trackingUrl: data.trackingUrl,
        stockUpdatesApplied: data.stockUpdatesApplied || false,
        stockRestored: data.stockRestored || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order;
    });

    return orders;
  } catch (error: any) {
    console.error('Get customer orders error:', error);
    throw new Error(error.message || 'Failed to fetch orders');
  }
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (!orderDoc.exists()) {
      return null;
    }

    const data = orderDoc.data();
    return {
      id: orderDoc.id,
      customerId: data.customerId || '',
      customerName: data.customerName || 'Unknown Customer',
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      customerPhone: data.customerPhone,
      vendorId: data.vendorId,
      vendors: data.vendors || [],
      products: data.products || [],
      totalAmount: data.totalAmount || 0,
      commission: data.commission || 0,
      vendorAmount: data.vendorAmount || 0,
      vendorEarnings: data.vendorEarnings || {},
      vendorCommissions: data.vendorCommissions || {},
      orderStatus: data.orderStatus || 'pending',
      paymentStatus: data.paymentStatus || 'pending',
      isPaidOut: data.isPaidOut || false,
      paidOutVendors: data.paidOutVendors || [],
      payoutDetails: data.payoutDetails || {},
      trackingNumber: data.trackingNumber,
      shippingCarrier: data.shippingCarrier,
      trackingUrl: data.trackingUrl,
      stockUpdatesApplied: data.stockUpdatesApplied || false,
      stockRestored: data.stockRestored || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Order;
  } catch (error: any) {
    console.error('Get order by ID error:', error);
    return null;
  }
};

// Interface for order creation input
export interface CreateOrderInput {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  products: OrderProduct[];
  totalAmount: number;
  paymentStatus?: 'pending' | 'paid';
}

/**
 * Creates a new order with automatic inventory reduction
 * NOTE: This function should be called via the API route /api/orders
 * Direct client-side usage is not supported
 */
export const createOrderWithInventoryUpdate = async (orderInput: CreateOrderInput): Promise<string> => {
  throw new Error('This function must be called via the API route /api/orders. Direct client-side usage is not supported.');
};
