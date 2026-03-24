import { 
  collection, 
  query, 
  where, 
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DashboardStats, Order, Product } from '@/lib/types';
import { getVendorStats, initializeVendorStats } from './vendorStatsService';

export interface ChartData {
  name: string;
  revenue: number;
  orders: number;
}

// Get dashboard stats with fallback to direct collection queries
export const getVendorDashboardStats = async (vendorId: string): Promise<DashboardStats> => {
  try {
    // First try to get from optimized stats document
    const stats = await getVendorStats(vendorId);
    
    // If stats document exists and has data, use it
    if (stats.totalOrders > 0 || stats.totalProducts > 0) {
      return {
        totalProducts: stats.totalProducts,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        pendingOrders: stats.pendingOrders,
        completedOrders: stats.completedOrders,
        cancelledOrders: 0,
        pendingPayout: stats.availableBalance
      };
    }
    
    // Fallback: Calculate stats directly from collections
    console.log('Stats document empty, calculating from collections...');
    return await calculateStatsFromCollections(vendorId);
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    // Fallback to direct calculation if stats service fails
    return await calculateStatsFromCollections(vendorId);
  }
};

// Calculate stats directly from Firestore collections
const calculateStatsFromCollections = async (vendorId: string): Promise<DashboardStats> => {
  try {
    // Get products count
    const productsQuery = query(
      collection(db, 'products'),
      where('vendorId', '==', vendorId)
    );
    const productsSnapshot = await getCountFromServer(productsQuery);
    const totalProducts = productsSnapshot.data().count;

    // Get orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Order[];

    // Calculate order statistics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => 
      o.orderStatus === 'pending' || o.orderStatus === 'processing'
    ).length;
    const completedOrders = orders.filter(o => 
      o.orderStatus === 'delivered'
    ).length;
    const cancelledOrders = orders.filter(o => 
      o.orderStatus === 'cancelled'
    ).length;

    // Calculate revenue and earnings
    let totalRevenue = 0;
    let totalEarnings = 0;
    let pendingPayout = 0;

    orders.forEach(order => {
      if (order.paymentStatus === 'paid') {
        const vendorEarning = order.vendorEarnings?.[vendorId] || 0;
        totalEarnings += vendorEarning;
        
        // Add to pending payout if not paid out yet
        if (!order.paidOutVendors?.includes(vendorId)) {
          pendingPayout += vendorEarning;
        }
      }
      
      // Calculate total revenue from vendor's products in the order
      order.products.forEach(product => {
        if (product.vendorId === vendorId) {
          totalRevenue += product.price * product.quantity;
        }
      });
    });

    const dashboardStats = {
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      pendingPayout: Math.round(pendingPayout * 100) / 100
    };

    // Initialize stats document for future use (optional)
    try {
      await initializeVendorStats(vendorId);
      console.log('Initialized vendor stats document');
    } catch (initError) {
      console.warn('Could not initialize vendor stats (this is okay):', initError);
      // Don't throw error, just continue without initializing
    }

    return dashboardStats;
  } catch (error) {
    console.error('Error calculating stats from collections:', error);
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingPayout: 0
    };
  }
};

// Get last 7 days revenue and orders data for charts
export const getWeeklyChartData = async (vendorId: string): Promise<ChartData[]> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'asc')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Order[];

    console.log(`Found ${orders.length} orders for vendor ${vendorId} in last 7 days`);

    // Group orders by day
    const dailyData: { [key: string]: { revenue: number; orders: number } } = {};
    
    // Initialize last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      dailyData[dayName] = { revenue: 0, orders: 0 };
    }

    // Aggregate order data
    orders.forEach(order => {
      if (order.createdAt) {
        const dayName = days[order.createdAt.getDay()];
        let vendorEarning = 0;
        
        // Calculate vendor earnings from this order
        if (order.vendorEarnings?.[vendorId]) {
          vendorEarning = order.vendorEarnings[vendorId];
        } else {
          // Fallback: calculate from products if vendorEarnings not set
          order.products.forEach(product => {
            if (product.vendorId === vendorId) {
              vendorEarning += product.price * product.quantity * 0.9; // Assuming 10% commission
            }
          });
        }
        
        if (dailyData[dayName]) {
          dailyData[dayName].revenue += vendorEarning;
          dailyData[dayName].orders += 1;
        }
      }
    });

    // Convert to chart format
    const chartData = Object.entries(dailyData).map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders
    }));

    console.log('Chart data:', chartData);
    return chartData;
  } catch (error) {
    console.error('Error fetching weekly chart data:', error);
    // Return default data if error
    return [
      { name: 'Sun', revenue: 0, orders: 0 },
      { name: 'Mon', revenue: 0, orders: 0 },
      { name: 'Tue', revenue: 0, orders: 0 },
      { name: 'Wed', revenue: 0, orders: 0 },
      { name: 'Thu', revenue: 0, orders: 0 },
      { name: 'Fri', revenue: 0, orders: 0 },
      { name: 'Sat', revenue: 0, orders: 0 },
    ];
  }
};

// Get recent orders for dashboard
export const getRecentOrders = async (vendorId: string, limitCount: number = 5): Promise<Order[]> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendors', 'array-contains', vendorId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Order[];
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }
};
