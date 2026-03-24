'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorOrders } from '@/services/orderService';
import { Order } from '@/lib/types';

export default function EarningsPage() {
  const { vendor } = useVendorAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate] = useState(10);

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
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalCommission = orders.reduce((sum, order) => sum + (order.commission || 0), 0);
    const totalEarnings = orders.reduce((sum, order) => sum + order.vendorAmount, 0);
    const pendingPayout = orders
      .filter(order => order.orderStatus === 'delivered')
      .reduce((sum, order) => sum + order.vendorAmount, 0);

    return {
      totalSales,
      totalCommission,
      totalEarnings,
      pendingPayout
    };
  };

  const earnings = calculateEarnings();

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
        <h1 className="text-3xl font-bold text-gray-800">Earnings Report</h1>
        <p className="text-gray-600 mt-1">Track your revenue and commissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm mb-1">Total Sales</p>
          <p className="text-3xl font-bold">₹{earnings.totalSales.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm mb-1">Your Earnings</p>
          <p className="text-3xl font-bold">₹{earnings.totalEarnings.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl shadow-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm mb-1">Platform Commission</p>
          <p className="text-3xl font-bold">₹{earnings.totalCommission.toFixed(2)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-2xl shadow-lg text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm mb-1">Pending Payout</p>
          <p className="text-3xl font-bold">₹{earnings.pendingPayout.toFixed(2)}</p>
        </motion.div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Commission Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Platform Commission Rate</p>
            <p className="text-2xl font-bold text-purple-600">{commissionRate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Commission Paid</p>
            <p className="text-2xl font-bold text-purple-600">₹{earnings.totalCommission.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Your Net Earnings</p>
            <p className="text-2xl font-bold text-green-600">₹{earnings.totalEarnings.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-600">{order.createdAt.toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">₹{order.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-green-600">Your Earnings: ₹{order.vendorAmount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
