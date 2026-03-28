'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Clock, DollarSign, TrendingUp, CheckCircle, Eye } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardStats, Order } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorDashboardStats, getWeeklyChartData, getRecentOrders, ChartData } from '@/services/dashboardService';

export default function DashboardPage() {
  const { vendor } = useVendorAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor) {
      loadDashboardData();
    }
  }, [vendor]);

  const loadDashboardData = async () => {
    if (!vendor) return;

    try {
      setLoading(true);
      console.log('Loading dashboard data for vendor:', vendor.uid);
      
      const [dashboardStats, weeklyData, orders] = await Promise.all([
        getVendorDashboardStats(vendor.uid),
        getWeeklyChartData(vendor.uid),
        getRecentOrders(vendor.uid, 5)
      ]);
      
      console.log('Dashboard stats:', dashboardStats);
      console.log('Weekly data:', weeklyData);
      console.log('Recent orders:', orders);
      
      setStats(dashboardStats);
      setChartData(weeklyData);
      setRecentOrders(orders);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg animate-pulse">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { 
      label: 'Total Products', 
      value: stats.totalProducts, 
      icon: Package, 
      gradient: 'from-purple-500 to-indigo-600',
      change: '+12%'
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      gradient: 'from-blue-500 to-cyan-600',
      change: '+8%'
    },
    { 
      label: 'Pending Orders', 
      value: stats.pendingOrders, 
      icon: Clock, 
      gradient: 'from-orange-500 to-red-600',
      change: '-3%'
    },
    { 
      label: 'Completed Orders', 
      value: stats.completedOrders, 
      icon: CheckCircle, 
      gradient: 'from-green-500 to-emerald-600',
      change: '+15%'
    },
    { 
      label: 'Cancelled Orders', 
      value: stats.cancelledOrders, 
      icon: Clock, 
      gradient: 'from-red-500 to-rose-600',
      change: '-5%'
    },
    { 
      label: 'Total Earnings', 
      value: `₹${stats.totalRevenue.toFixed(2)}`, 
      icon: DollarSign, 
      gradient: 'from-teal-500 to-cyan-600',
      change: '+23%'
    },
    { 
      label: 'Pending Payout', 
      value: `₹${stats.pendingPayout.toFixed(2)}`, 
      icon: DollarSign, 
      gradient: 'from-pink-500 to-rose-600',
      change: '+10%'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {vendor?.storeName || 'Vendor'}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`bg-gradient-to-br ${card.gradient} p-6 rounded-2xl shadow-lg text-white relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">{card.change}</span>
              </div>
              <p className="text-white text-opacity-90 text-sm mb-1">{card.label}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Revenue Overview</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(2)}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Weekly Orders</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: number | undefined) => [value || 0, 'Orders']}
              />
              <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
            </div>
            <span className="text-sm text-gray-500">{recentOrders.length} orders</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent orders found</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(() => {
                        if (!vendor) return '0.00';
                        
                        // Handle both single-vendor and multi-vendor structures
                        if (typeof order.vendorEarnings === 'object' && order.vendorEarnings !== null) {
                          return (order.vendorEarnings[vendor.uid] || 0).toFixed(2);
                        } else if (typeof order.vendorEarnings === 'number') {
                          if (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid)) {
                            return order.vendorEarnings.toFixed(2);
                          }
                        } else if (order.vendorAmount && (order.vendorId === vendor.uid || order.vendors?.includes(vendor.uid))) {
                          return order.vendorAmount.toFixed(2);
                        }
                        return '0.00';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
