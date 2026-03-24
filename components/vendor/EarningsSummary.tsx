'use client';

import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { VendorEarnings } from '@/services/earningsService';

interface EarningsSummaryProps {
  earnings: VendorEarnings | null;
  loading?: boolean;
  className?: string;
}

export default function EarningsSummary({ 
  earnings, 
  loading = false, 
  className = "" 
}: EarningsSummaryProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!earnings) return null;

  const summaryCards = [
    {
      title: 'Total Earnings',
      value: `₹${earnings.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Available Balance',
      value: `₹${earnings.availableBalance.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Payouts',
      value: `₹${earnings.pendingPayouts.toLocaleString()}`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Completed Payouts',
      value: `₹${earnings.completedPayouts.toLocaleString()}`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${className}`}>
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}