import { useState } from 'react';
import { createOrder as createOrderUtil, OrderCreationResult, CartItem } from '@/lib/utils/orderUtils';

interface CreateOrderParams {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  cartItems: CartItem[];
  paymentStatus?: 'pending' | 'paid';
}

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (params: CreateOrderParams): Promise<OrderCreationResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await createOrderUtil(params);
      
      if (!result.success) {
        setError(result.error || 'Failed to create order');
      }
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        type: 'SERVER_ERROR'
      };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    createOrder,
    loading,
    error,
    clearError
  };
};
