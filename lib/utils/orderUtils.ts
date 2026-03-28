import { OrderProduct } from '@/lib/types';
import { getPlatformSettings } from '@/services/settingsService';

/**
 * Utility functions for order management
 */

export interface CartItem {
  productId: string;
  vendorId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stock: number; // Available stock
}

export interface OrderCreationResult {
  success: boolean;
  orderId?: string;
  error?: string;
  type?: 'STOCK_ERROR' | 'SERVER_ERROR';
}

/**
 * Validates cart items before order creation
 */
export const validateCartForOrder = (cartItems: CartItem[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!cartItems || cartItems.length === 0) {
    errors.push('Cart is empty');
    return { isValid: false, errors };
  }

  cartItems.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Missing product ID`);
    }
    if (!item.vendorId) {
      errors.push(`Item ${index + 1}: Missing vendor ID`);
    }
    if (!item.name) {
      errors.push(`Item ${index + 1}: Missing product name`);
    }
    if (!item.price || item.price <= 0) {
      errors.push(`Item ${index + 1}: Invalid price`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
    if (item.quantity > item.stock) {
      errors.push(`${item.name}: Requested quantity (${item.quantity}) exceeds available stock (${item.stock})`);
    }
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Converts cart items to order products
 */
export const cartItemsToOrderProducts = (cartItems: CartItem[]): OrderProduct[] => {
  return cartItems.map(item => ({
    productId: item.productId,
    vendorId: item.vendorId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image
  }));
};

/**
 * Calculates order totals with tax
 * Fetches tax rate from platform settings
 * Example: Product price ₹900, tax rate 18%
 * - Subtotal: ₹900
 * - Tax (18% GST): ₹162
 * - Total: ₹1062 (customer pays this)
 * - Commission (from settings, e.g., 10% of subtotal): ₹90
 * - Vendor earnings: ₹810 (subtotal - commission)
 */
export const calculateOrderTotals = async (cartItems: CartItem[]) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Group by vendor for multi-vendor calculations
  const vendorTotals: { [vendorId: string]: number } = {};
  cartItems.forEach(item => {
    if (!vendorTotals[item.vendorId]) {
      vendorTotals[item.vendorId] = 0;
    }
    vendorTotals[item.vendorId] += item.price * item.quantity;
  });

  const vendorCount = Object.keys(vendorTotals).length;
  
  // Fetch platform settings for dynamic tax rate
  const settings = await getPlatformSettings();
  const taxRate = settings.taxPercentage / 100; // Convert percentage to decimal
  
  // Calculate shipping and tax
  const shipping = 0; // Free shipping for now
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return {
    subtotal,
    shipping,
    tax,
    total,
    vendorTotals,
    vendorCount
  };
};

/**
 * Creates an order via API
 */
export const createOrder = async (orderData: {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  cartItems: CartItem[];
  paymentStatus?: 'pending' | 'paid';
}): Promise<OrderCreationResult> => {
  try {
    // Validate cart
    const validation = validateCartForOrder(orderData.cartItems);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        type: 'STOCK_ERROR'
      };
    }

    // Calculate totals (now async)
    const { total } = await calculateOrderTotals(orderData.cartItems);

    // Convert cart items to order products
    const products = cartItemsToOrderProducts(orderData.cartItems);

    // Create order via API
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerAddress: orderData.customerAddress,
        customerPhone: orderData.customerPhone,
        products,
        totalAmount: total,
        paymentStatus: orderData.paymentStatus || 'pending'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create order',
        type: result.type || 'SERVER_ERROR'
      };
    }

    return {
      success: true,
      orderId: result.orderId
    };

  } catch (error: any) {
    console.error('Create order error:', error);
    return {
      success: false,
      error: error.message || 'Network error occurred',
      type: 'SERVER_ERROR'
    };
  }
};

/**
 * Updates order status via API
 */
export const updateOrderStatus = async (
  orderId: string,
  orderStatus: string,
  trackingInfo?: {
    trackingNumber?: string;
    shippingCarrier?: string;
    trackingUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderStatus,
        ...trackingInfo
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update order status'
      };
    }

    return { success: true };

  } catch (error: any) {
    console.error('Update order status error:', error);
    return {
      success: false,
      error: error.message || 'Network error occurred'
    };
  }
};

/**
 * Formats order status for display
 */
export const formatOrderStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
};

/**
 * Gets order status color for UI
 */
export const getOrderStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'pending': 'text-yellow-600 bg-yellow-100',
    'processing': 'text-blue-600 bg-blue-100',
    'shipped': 'text-purple-600 bg-purple-100',
    'delivered': 'text-green-600 bg-green-100',
    'cancelled': 'text-red-600 bg-red-100'
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};