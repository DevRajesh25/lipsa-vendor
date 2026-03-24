import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface VendorStats {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  completedPayouts: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  lastUpdated: Date;
}

// Get vendor stats from optimized stats document
export const getVendorStats = async (vendorId: string): Promise<VendorStats> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        totalEarnings: data.totalEarnings || 0,
        availableBalance: data.availableBalance || 0,
        pendingPayouts: data.pendingPayouts || 0,
        completedPayouts: data.completedPayouts || 0,
        totalOrders: data.totalOrders || 0,
        totalProducts: data.totalProducts || 0,
        pendingOrders: data.pendingOrders || 0,
        completedOrders: data.completedOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    }
    
    // Return empty stats if document doesn't exist (don't try to create it)
    console.log('Vendor stats document does not exist, returning empty stats');
    return {
      totalEarnings: 0,
      availableBalance: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
      totalOrders: 0,
      totalProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error getting vendor stats:', error);
    // Return empty stats on error
    return {
      totalEarnings: 0,
      availableBalance: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
      totalOrders: 0,
      totalProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      lastUpdated: new Date()
    };
  }
};

// Initialize vendor stats document
export const initializeVendorStats = async (vendorId: string): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    await setDoc(statsRef, {
      totalEarnings: 0,
      availableBalance: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
      totalOrders: 0,
      totalProducts: 0,
      pendingOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error initializing vendor stats:', error);
    throw error;
  }
};

// Update stats when order is created
export const updateStatsOnOrderCreated = async (
  vendorId: string,
  vendorEarnings: number,
  orderTotal: number
): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    await updateDoc(statsRef, {
      totalOrders: increment(1),
      pendingOrders: increment(1),
      totalEarnings: increment(vendorEarnings),
      availableBalance: increment(vendorEarnings),
      totalRevenue: increment(orderTotal),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating stats on order created:', error);
    throw error;
  }
};

// Update stats when order status changes
export const updateStatsOnOrderStatusChange = async (
  vendorId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    const updates: any = {
      lastUpdated: Timestamp.now()
    };

    // Decrement old status count
    if (oldStatus === 'pending' || oldStatus === 'processing') {
      updates.pendingOrders = increment(-1);
    } else if (oldStatus === 'delivered' || oldStatus === 'completed') {
      updates.completedOrders = increment(-1);
    }

    // Increment new status count
    if (newStatus === 'pending' || newStatus === 'processing') {
      updates.pendingOrders = increment(1);
    } else if (newStatus === 'delivered' || newStatus === 'completed') {
      updates.completedOrders = increment(1);
    }

    await updateDoc(statsRef, updates);
  } catch (error) {
    console.error('Error updating stats on order status change:', error);
    throw error;
  }
};

// Update stats when payout is requested
export const updateStatsOnPayoutRequested = async (
  vendorId: string,
  amount: number
): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    await updateDoc(statsRef, {
      pendingPayouts: increment(amount),
      availableBalance: increment(-amount),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating stats on payout requested:', error);
    throw error;
  }
};

// Update stats when payout is completed
export const updateStatsOnPayoutCompleted = async (
  vendorId: string,
  amount: number
): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    await updateDoc(statsRef, {
      pendingPayouts: increment(-amount),
      completedPayouts: increment(amount),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating stats on payout completed:', error);
    throw error;
  }
};

// Update stats when payout is rejected
export const updateStatsOnPayoutRejected = async (
  vendorId: string,
  amount: number
): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    await updateDoc(statsRef, {
      pendingPayouts: increment(-amount),
      availableBalance: increment(amount),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating stats on payout rejected:', error);
    throw error;
  }
};

// Update product count
export const updateProductCount = async (
  vendorId: string,
  delta: number
): Promise<void> => {
  try {
    const statsRef = doc(db, 'vendorStats', vendorId);
    await updateDoc(statsRef, {
      totalProducts: increment(delta),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating product count:', error);
    throw error;
  }
};
