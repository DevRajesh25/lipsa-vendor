'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Clock, CheckCircle, Truck, XCircle, Eye, RefreshCw } from 'lucide-react';
import { Order } from '@/lib/types';
import { getAllOrders } from '@/services/orderService';
import Toast from '@/components/vendor/Toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders);
      setToast({ message: `Loaded ${fetchedOrders.length} orders`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">All Orders (Admin)</h1>
              <p className="text-gray-600 mt-1">View and manage all orders in the system</p>
            </div>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">{orders.length}</p>
                <p className="text-sm text-gray-600">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.orderStatus === 'pending').length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.orderStatus === 'processing').length}</p>
                <p className="text-sm text-gray-600">Processing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.orderStatus === 'delivered').length}</p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, order ID, or product name..."
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
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm mt-2">
                {orders.length === 0 ? "No orders in the database." : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
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
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">Customer: {order.customerName}</p>
                      <p className="text-gray-600 mb-1">Customer ID: {order.customerId}</p>
                      <p className="text-gray-600 mb-1">Products: {order.products.length} items</p>
                      <p className="text-gray-600 mb-1">Date: {order.createdAt.toLocaleDateString()}</p>
                      {order.vendors && order.vendors.length > 0 && (
                        <p className="text-gray-600 mb-1">Vendors: {order.vendors.join(', ')}</p>
                      )}
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
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Order Items:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {order.products.slice(0, 6).map((product, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">{product.name}</span>
                          <span>x{product.quantity}</span>
                          <span className="ml-auto">₹{(product.price * product.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.products.length > 6 && (
                        <div className="flex items-center justify-center p-2 bg-gray-50 rounded text-sm text-gray-600">
                          +{order.products.length - 6} more items
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
      </div>
    </div>
  );
}