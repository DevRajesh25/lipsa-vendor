'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, ShoppingCart, DollarSign, Calendar, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorAnalytics, getVendorAllTimeAnalytics, AnalyticsData } from '@/services/analyticsService';
import Toast from '@/components/vendor/Toast';

// Memoized chart components for better performance
const MemoizedAreaChart = React.memo(AreaChart);
const MemoizedBarChart = React.memo(BarChart);

export default function AnalyticsPage() {
  const { vendor } = useVendorAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);

  const loadAnalytics = useCallback(async () => {
    if (!vendor) return;
    
    const startTime = performance.now();
    
    try {
      setLoading(true);
      let data: AnalyticsData;
      
      if (selectedPeriod === 'all') {
        data = await getVendorAllTimeAnalytics(vendor.uid);
      } else {
        data = await getVendorAnalytics(vendor.uid, parseInt(selectedPeriod));
      }
      
      setAnalytics(data);
      
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
      console.log(`✅ Analytics loaded in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load analytics', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [vendor, selectedPeriod]);

  useEffect(() => {
    if (vendor) {
      loadAnalytics();
    }
  }, [vendor, loadAnalytics]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const dailySalesData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.dailySales)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        sales
      }));
  }, [analytics]);

  const topProductsData = useMemo(() => {
    if (!analytics) return [];
    return analytics.topProducts.slice(0, 5).map(product => ({
      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
      quantity: product.quantity
    }));
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">No analytics data available</h2>
          <p className="text-gray-500">Complete some orders to see your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your store performance</p>
          {loadTime > 0 && (
            <p className="text-xs text-gray-400 mt-1">Loaded in {loadTime.toFixed(0)}ms</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Revenue', 
            value: formatCurrency(analytics.totalRevenue), 
            icon: DollarSign, 
            gradient: 'from-green-500 to-emerald-600',
            rawValue: analytics.totalRevenue
          },
          { 
            label: 'Total Orders', 
            value: analytics.totalOrders.toString(), 
            icon: ShoppingCart, 
            gradient: 'from-blue-500 to-cyan-600',
            rawValue: analytics.totalOrders
          },
          { 
            label: 'Products Sold', 
            value: analytics.totalProductsSold.toString(), 
            icon: Package, 
            gradient: 'from-purple-500 to-indigo-600',
            rawValue: analytics.totalProductsSold
          },
          { 
            label: 'Avg Order Value', 
            value: formatCurrency(analytics.averageOrderValue), 
            icon: TrendingUp, 
            gradient: 'from-orange-500 to-red-600',
            rawValue: analytics.averageOrderValue
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-2xl shadow-lg text-white relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-white text-opacity-90 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Sales Over Time</h2>
          </div>
          {dailySalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <MemoizedAreaChart data={dailySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Sales']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </MemoizedAreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sales data for this period</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Top Selling Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Top Selling Products</h2>
          </div>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <MemoizedBarChart data={topProductsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: number | undefined) => [value || 0, 'Quantity Sold']}
                />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </MemoizedBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No product sales data available</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Products List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-800">Top Selling Products Details</h2>
        </div>
        {analytics.topProducts.length > 0 ? (
          <div className="space-y-4">
            {analytics.topProducts.slice(0, 10).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No product sales data available</p>
            </div>
          </div>
        )}
      </motion.div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
