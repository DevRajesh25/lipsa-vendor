'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Eye, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Order } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorOrders, updateOrderStatus } from '@/services/orderService.client';
import Toast from '@/components/vendor/Toast';

export default function OrdersPage() {
  const { vendor } = useVendorAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [trackingInfo, setTrackingInfo] = useState({
    trackingNumber: '',
    shippingCarrier: '',
    trackingUrl: ''
  });

  useEffect(() => {
    if (vendor) {
      loadOrders();
    }
  }, [vendor]);

  const loadOrders = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const fetchedOrders = await getVendorOrders(vendor.uid);
      setOrders(fetchedOrders);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['orderStatus']) => {
    try {
      // If shipping, show tracking modal
      if (newStatus === 'shipped') {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrderForDetails(order || null);
        setTrackingInfo({
          trackingNumber: order?.trackingNumber || '',
          shippingCarrier: order?.shippingCarrier || '',
          trackingUrl: order?.trackingUrl || ''
        });
        setShowTrackingModal(true);
        return;
      }
      
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      ));
      setToast({ message: 'Order status updated successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update order status', type: 'error' });
    }
  };

  const handleTrackingSubmit = async () => {
    if (!selectedOrderForDetails) return;
    
    try {
      await updateOrderStatus(selectedOrderForDetails.id, 'shipped', trackingInfo);
      setOrders(orders.map(order => 
        order.id === selectedOrderForDetails.id 
          ? { ...order, orderStatus: 'shipped', ...trackingInfo } 
          : order
      ));
      setToast({ message: 'Order marked as shipped with tracking info', type: 'success' });
      setShowTrackingModal(false);
      setSelectedOrderForDetails(null);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update tracking info', type: 'error' });
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerDisplay = order.customerName || order.customerEmail || 'Unknown Customer';
    const matchesSearch = customerDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.orderStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'delivered': return <CheckCircle className="w-5 h-5" />;
      default: return <XCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNextStatus = (currentStatus: Order['orderStatus']): Order['orderStatus'] | null => {
    const statusFlow: Record<Order['orderStatus'], Order['orderStatus'] | null> = {
      'pending': 'processing',
      'processing': 'shipped',
      'shipped': 'delivered',
      'delivered': null,
      'cancelled': null
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-600 mt-1">Manage your customer orders</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm text-gray-900"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Order #{order.id.slice(0, 8)}</h3>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                      {getStatusIcon(order.orderStatus)}
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                    {order.isPaidOut && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        Paid Out
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">Customer: {order.customerName || order.customerEmail || 'Unknown Customer'}</p>
                  <p className="text-gray-600 mb-1">Products: {order.products.length} items</p>
                  <p className="text-gray-600 mb-1">Date: {order.createdAt.toLocaleDateString()}</p>
                  {order.trackingNumber && (
                    <p className="text-sm text-blue-600 mt-2">
                      Tracking: {order.trackingNumber} ({order.shippingCarrier})
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-purple-600">₹{order.totalAmount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Your Earnings: ₹{order.vendorAmount.toFixed(2)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrderForDetails(order);
                        setShowOrderDetails(true);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-medium"
                    >
                      View Details
                    </button>
                    
                    {getNextStatus(order.orderStatus) && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.orderStatus)!)}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium"
                      >
                        {(() => {
                          const nextStatus = getNextStatus(order.orderStatus);
                          return `Mark as ${nextStatus?.charAt(0).toUpperCase()}${nextStatus?.slice(1)}`;
                        })()}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                <div className="space-y-1">
                  {order.products.map((product, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-600">
                      <span>{product.name} x {product.quantity}</span>
                      <span>₹{(product.price * product.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Tracking Information Modal */}
      {showTrackingModal && selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Tracking Information</h2>
            <p className="text-sm text-gray-600 mb-6">
              Order #{selectedOrderForDetails.id.slice(0, 8)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  value={trackingInfo.trackingNumber}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })}
                  placeholder="e.g., TRK123456789"
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Carrier *
                </label>
                <input
                  type="text"
                  value={trackingInfo.shippingCarrier}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, shippingCarrier: e.target.value })}
                  placeholder="e.g., Delhivery, Blue Dart"
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={trackingInfo.trackingUrl}
                  onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingUrl: e.target.value })}
                  placeholder="https://tracking.example.com/..."
                  className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTrackingSubmit}
                disabled={!trackingInfo.trackingNumber || !trackingInfo.shippingCarrier}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark as Shipped
              </button>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setSelectedOrderForDetails(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
              <button
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrderForDetails(null);
                }}
                className="text-gray-600 hover:text-gray-800 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Information */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-medium text-gray-900">#{selectedOrderForDetails.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium text-gray-900">{selectedOrderForDetails.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedOrderForDetails.orderStatus)}`}>
                      {getStatusIcon(selectedOrderForDetails.orderStatus)}
                      {selectedOrderForDetails.orderStatus.charAt(0).toUpperCase() + selectedOrderForDetails.orderStatus.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedOrderForDetails.paymentStatus}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedOrderForDetails.customerName || 'Not provided'}</p>
                  </div>
                  {selectedOrderForDetails.customerEmail && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedOrderForDetails.customerEmail}</p>
                    </div>
                  )}
                  {selectedOrderForDetails.customerPhone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{selectedOrderForDetails.customerPhone}</p>
                    </div>
                  )}
                  {selectedOrderForDetails.customerAddress && (
                    <div>
                      <p className="text-sm text-gray-600">Shipping Address</p>
                      <p className="font-medium text-gray-900">{selectedOrderForDetails.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Products Ordered</h3>
                <div className="space-y-3">
                  {selectedOrderForDetails.products.map((product, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                        <p className="text-sm text-gray-600">Unit Price: ₹{product.price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">₹{(product.price * product.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-medium text-gray-900">₹{selectedOrderForDetails.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission</span>
                    <span className="font-medium text-gray-900">₹{selectedOrderForDetails.commission.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-gray-800">Your Earnings</span>
                    <span className="font-bold text-purple-600">₹{selectedOrderForDetails.vendorAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Tracking Information */}
              {selectedOrderForDetails.trackingNumber && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Tracking Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Tracking Number</p>
                      <p className="font-medium text-gray-900">{selectedOrderForDetails.trackingNumber}</p>
                    </div>
                    {selectedOrderForDetails.shippingCarrier && (
                      <div>
                        <p className="text-sm text-gray-600">Shipping Carrier</p>
                        <p className="font-medium text-gray-900">{selectedOrderForDetails.shippingCarrier}</p>
                      </div>
                    )}
                    {selectedOrderForDetails.trackingUrl && (
                      <div>
                        <p className="text-sm text-gray-600">Track Package</p>
                        <a 
                          href={selectedOrderForDetails.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Click here to track
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrderForDetails(null);
                }}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
