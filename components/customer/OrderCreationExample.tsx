'use client';

import React, { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { CartItem, calculateOrderTotals, formatOrderStatus } from '@/lib/utils/orderUtils';

/**
 * Example component demonstrating order creation with inventory management
 */
export const OrderCreationExample: React.FC = () => {
  const { createOrder, loading, error, clearError } = useOrders();
  const [orderResult, setOrderResult] = useState<{ orderId?: string; success: boolean } | null>(null);

  // Example cart items
  const [cartItems] = useState<CartItem[]>([
    {
      productId: 'product_123',
      vendorId: 'vendor_456',
      name: 'Wireless Headphones',
      price: 2999,
      quantity: 1,
      stock: 10,
      image: 'https://example.com/headphones.jpg'
    },
    {
      productId: 'product_789',
      vendorId: 'vendor_101',
      name: 'Smartphone Case',
      price: 599,
      quantity: 2,
      stock: 25,
      image: 'https://example.com/case.jpg'
    }
  ]);

  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    customerId: 'customer_123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerAddress: '123 Main St, City, State 12345',
    customerPhone: '+1234567890'
  });

  const totals = calculateOrderTotals(cartItems);

  const handleCreateOrder = async () => {
    clearError();
    setOrderResult(null);

    const result = await createOrder({
      ...customerInfo,
      cartItems,
      paymentStatus: 'paid' // Assuming payment is completed
    });

    setOrderResult(result);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Order Creation Example</h2>

      {/* Customer Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={customerInfo.customerName}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={customerInfo.customerEmail}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, customerEmail: e.target.value }))}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={customerInfo.customerAddress}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, customerAddress: e.target.value }))}
              className="w-full p-2 border rounded-md"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={customerInfo.customerPhone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, customerPhone: e.target.value }))}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Cart Items</h3>
        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center space-x-3">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                )}
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">Vendor ID: {item.vendorId}</p>
                  <p className="text-sm text-gray-600">Stock: {item.stock} available</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{item.price.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                <p className="text-sm font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span>₹{totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping:</span>
            <span>₹{totals.shipping.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Tax:</span>
            <span>₹{totals.tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>₹{totals.total.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p>Vendors: {totals.vendorCount}</p>
            <p>Items: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Success Display */}
      {orderResult && orderResult.success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <p className="font-medium">Order Created Successfully!</p>
          <p>Order ID: {orderResult.orderId}</p>
          <p>Inventory has been automatically reduced for all products.</p>
        </div>
      )}

      {/* Failed Order Display */}
      {orderResult && !orderResult.success && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="font-medium">Order Creation Failed:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Create Order Button */}
      <button
        onClick={handleCreateOrder}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md font-medium ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Creating Order...' : 'Create Order'}
      </button>

      {/* Implementation Notes */}
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h4 className="font-semibold mb-2">Implementation Features:</h4>
        <ul className="text-sm space-y-1">
          <li>✅ Automatic inventory reduction using Firestore transactions</li>
          <li>✅ Stock validation before order creation</li>
          <li>✅ Multi-vendor order support</li>
          <li>✅ Atomic operations (all-or-nothing)</li>
          <li>✅ Vendor earnings and commission calculation</li>
          <li>✅ Automatic vendor notifications</li>
          <li>✅ Error handling for stock conflicts</li>
          <li>✅ Inventory restoration on order cancellation</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderCreationExample;