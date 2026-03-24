import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  getVendorEarnings, 
  getEarningsBreakdown,
  getVendorPayoutRequests,
  VendorEarnings,
  EarningsBreakdown 
} from '@/services/earningsService';
import { PayoutRequest } from '@/lib/types';

export const useEarnings = (vendorId: string | undefined) => {
  const [earnings, setEarnings] = useState<VendorEarnings | null>(null);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);

  // Memoize calculations to prevent re-renders
  const earningsSummary = useMemo(() => {
    if (!earnings) return null;
    
    return {
      totalEarnings: earnings.totalEarnings,
      availableBalance: earnings.availableBalance,
      pendingPayouts: earnings.pendingPayouts,
      completedPayouts: earnings.completedPayouts,
      totalOrders: earnings.totalOrders,
      // Calculate percentage metrics
      payoutPercentage: earnings.totalEarnings > 0 
        ? Math.round((earnings.completedPayouts / earnings.totalEarnings) * 100) 
        : 0,
      availablePercentage: earnings.totalEarnings > 0 
        ? Math.round((earnings.availableBalance / earnings.totalEarnings) * 100) 
        : 0
    };
  }, [earnings]);

  // Memoize filtered breakdown data
  const recentEarnings = useMemo(() => {
    return breakdown.slice(0, 20); // Show only recent 20 for performance
  }, [breakdown]);

  const loadEarningsData = useCallback(async () => {
    if (!vendorId) return;

    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);
      
      // Parallel data fetching - OPTIMIZED with stats document
      const [earningsData, breakdownData, payoutsData] = await Promise.all([
        getVendorEarnings(vendorId),
        getEarningsBreakdown(vendorId),
        getVendorPayoutRequests(vendorId)
      ]);
      
      setEarnings(earningsData);
      setBreakdown(breakdownData);
      setPayoutRequests(payoutsData);
      
      const endTime = performance.now();
      setLoadTime(endTime - startTime);
      console.log(`✅ Earnings data loaded in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (err: any) {
      console.error('Error loading earnings data:', err);
      setError(err.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadEarningsData();
  }, [loadEarningsData]);

  return {
    earnings,
    earningsSummary,
    breakdown: recentEarnings,
    payoutRequests,
    loading,
    error,
    loadTime,
    refetch: loadEarningsData
  };
};

export const usePayoutRequests = (vendorId: string | undefined) => {
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayoutRequests = useCallback(async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      setError(null);
      const requests = await getVendorPayoutRequests(vendorId);
      setPayoutRequests(requests);
    } catch (err: any) {
      console.error('Error loading payout requests:', err);
      setError(err.message || 'Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadPayoutRequests();
  }, [loadPayoutRequests]);

  return {
    payoutRequests,
    loading,
    error,
    refetch: loadPayoutRequests
  };
};