'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorOrders } from '@/services/orderService';
import { Order } from '@/lib/types';

export default function EarningsPage() {
  const { vendor } = useVendorAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!vendor) {
      return {
        totalSales: 0,
        totalEarnings: 0,
        pendingPayout: 0
      };
    }

    let totalSales = 0;
    let totalEarnings = 0;
    let pendingPayout = 0;

    orders.forEach(order => {
      // Handle both single-vendor and multi-vendor order structures
      let vendorEarning = 0;
      
      // Check if vendorEarnings is an object (multi-vendor) or number (single-vendor)
      if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
        // Multi-vendor: vendorEarnings = { vendorId: amount }
        vendorEarning = order.vendorEarnings[vendor.uid] || 0;
      } else if (typeof order.vendorEarnings === 'number') {
        // Single-vendor: vendorEarnings = amount (check if this vendor's order)
        if (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid)) {
          vendorEarning = order.vendorEarnings;
        }
      } else if (order.vendorAmount && (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid))) {
        // Fallback to legacy vendorAmount field
        vendorEarning = order.vendorAmount;
      }
      
      // Calculate total sales from vendor's products
      order.products.forEach(product => {
        if (product.vendorId === vendor.uid) {
          totalSales += product.price * product.quantity;
        }
      });

      // Count all earnings (not just paid orders)
      if (vendorEarning > 0) {
        totalEarnings += vendorEarning;
        
        // Add to pending payout if not paid out yet
        if (!order.paidOutVendors?.includes(vendor.uid) && !order.isPaidOut) {
          pendingPayout += vendorEarning;
        }
      }
    });

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      pendingPayout: Math.round(pendingPayout * 100) / 100
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders found</p>
          ) : (
            orders.slice(0, 10).map((order) => {
              // Handle both single-vendor and multi-vendor order structures
              let vendorEarning = 0;
              
              if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
                vendorEarning = vendor ? (order.vendorEarnings[vendor.uid] || 0) : 0;
              } else if (typeof order.vendorEarnings === 'number') {
                if (vendor && (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid))) {
                  vendorEarning = order.vendorEarnings;
                }
              } else if (order.vendorAmount && vendor && (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid))) {
                vendorEarning = order.vendorAmount;
              }
              
              const vendorSales = order.products
                .filter(p => vendor && p.vendorId === vendor.uid)
                .reduce((sum, p) => sum + (p.price * p.quantity), 0);
              
              return (
                <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{vendorSales.toFixed(2)}</p>
                    <p className="text-sm text-green-600">Your Earnings: ₹{vendorEarning.toFixed(2)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
