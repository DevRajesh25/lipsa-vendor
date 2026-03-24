import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProductsSold: number;
  averageOrderValue: number;
  dailySales: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export interface Order {
  id: string;
  vendorId: string;
  customerId: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export const getVendorAnalytics = async (
  vendorId: string, 
  days: number = 30
): Promise<AnalyticsData> => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Query completed orders for the vendor within date range
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    
    const orders: Order[] = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        vendorId: data.vendorId,
        customerId: data.customerId,
        products: data.products || [],
        totalAmount: data.totalAmount || 0,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    
    const totalProductsSold = orders.reduce((sum, order) => {
      return sum + order.products.reduce((productSum, product) => productSum + product.quantity, 0);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate daily sales
    const dailySales: Record<string, number> = {};
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailySales[dateKey] = (dailySales[dateKey] || 0) + order.totalAmount;
    });

    // Calculate top products
    const productStats: Record<string, { quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.products.forEach(product => {
        if (!productStats[product.name]) {
          productStats[product.name] = { quantity: 0, revenue: 0 };
        }
        productStats[product.name].quantity += product.quantity;
        productStats[product.name].revenue += product.price * product.quantity;
      });
    });

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      totalProductsSold,
      averageOrderValue,
      dailySales,
      topProducts
    };
  } catch (error: any) {
    console.error('Get vendor analytics error:', error);
    throw new Error(error.message || 'Failed to fetch analytics data');
  }
};

export const getVendorAllTimeAnalytics = async (vendorId: string): Promise<AnalyticsData> => {
  try {
    // Query all completed orders for the vendor
    const ordersQuery = query(
      collection(db, 'orders'),
      where('vendorId', '==', vendorId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    
    const orders: Order[] = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        vendorId: data.vendorId,
        customerId: data.customerId,
        products: data.products || [],
        totalAmount: data.totalAmount || 0,
        status: data.status,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });

    // Calculate metrics (same logic as above)
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    
    const totalProductsSold = orders.reduce((sum, order) => {
      return sum + order.products.reduce((productSum, product) => productSum + product.quantity, 0);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate daily sales
    const dailySales: Record<string, number> = {};
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailySales[dateKey] = (dailySales[dateKey] || 0) + order.totalAmount;
    });

    // Calculate top products
    const productStats: Record<string, { quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.products.forEach(product => {
        if (!productStats[product.name]) {
          productStats[product.name] = { quantity: 0, revenue: 0 };
        }
        productStats[product.name].quantity += product.quantity;
        productStats[product.name].revenue += product.price * product.quantity;
      });
    });

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      totalRevenue,
      totalOrders,
      totalProductsSold,
      averageOrderValue,
      dailySales,
      topProducts
    };
  } catch (error: any) {
    console.error('Get vendor all-time analytics error:', error);
    throw new Error(error.message || 'Failed to fetch analytics data');
  }
};