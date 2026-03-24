'use client';

import { memo, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Percent } from 'lucide-react';
import { VendorEarnings } from '@/services/earningsService';

interface OptimizedEarningsSummaryProps {
  earnings: VendorEarnings | null;
  loading?: boolean;
  className?: string;
}

// Memoized loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized summary card component
const SummaryCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bgColor,
  subtitle 
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  subtitle?: string;
}) => (
  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
));

SummaryCard.displayName = 'SummaryCard';

const OptimizedEarningsSummary = memo(({ 
  earnings, 
  loading = false, 
  className = "" 
}: OptimizedEarningsSummaryProps) => {
  // Memoize summary calculations
  const summaryData = useMemo(() => {
    if (!earnings) return null;

    const payoutPercentage = earnings.totalEarnings > 0 
      ? Math.round((earnings.completedPayouts / earnings.totalEarnings) * 100) 
      : 0;

    return [
      {
        title: 'Total Earnings',
        value: `₹${earnings.totalEarnings.toLocaleString()}`,
        icon: DollarSign,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        subtitle: `From ${earnings.totalOrders} orders`
      },
      {
        title: 'Available Balance',
        value: `₹${earnings.availableBalance.toLocaleString()}`,
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        subtitle: 'Ready for payout'
      },
      {
        title: 'Pending Payouts',
        value: `₹${earnings.pendingPayouts.toLocaleString()}`,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        subtitle: 'Processing requests'
      },
      {
        title: 'Completed Payouts',
        value: `₹${earnings.completedPayouts.toLocaleString()}`,
        icon: CheckCircle,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        subtitle: `${payoutPercentage}% of total earnings`
      }
    ];
  }, [earnings]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!summaryData) return null;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
      {summaryData.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
});

OptimizedEarningsSummary.displayName = 'OptimizedEarningsSummary';

export default OptimizedEarningsSummary;