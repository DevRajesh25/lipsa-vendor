'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Return } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorReturns, updateReturnStatus } from '@/services/returnService';
import Toast from '@/components/vendor/Toast';
import ConfirmModal from '@/components/vendor/ConfirmModal';

export default function ReturnsPage() {
  const { vendor } = useVendorAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ returnId: string; action: 'approve' | 'reject' } | null>(null);

  useEffect(() => {
    if (vendor) {
      loadReturns();
    }
  }, [vendor]);

  const loadReturns = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const fetchedReturns = await getVendorReturns(vendor.uid);
      setReturns(fetchedReturns);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load returns', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (returnId: string, status: Return['status']) => {
    try {
      await updateReturnStatus(returnId, status);
      setReturns(returns.map(ret => 
        ret.id === returnId ? { ...ret, status } : ret
      ));
      setToast({ 
        message: `Return ${status === 'approved' ? 'approved' : 'rejected'} successfully`, 
        type: 'success' 
      });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update return status', type: 'error' });
    } finally {
      setConfirmAction(null);
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = (ret.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (ret.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || ret.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'refunded': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'refunded': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-800">Returns & Refunds</h1>
        <p className="text-gray-600 mt-1">Manage customer return requests</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none shadow-sm text-gray-900"
        >
          <option value="all">All Returns</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {filteredReturns.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No return requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((returnItem, index) => (
            <motion.div
              key={returnItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{returnItem.productName || 'Unknown Product'}</h3>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(returnItem.status || 'pending')}`}>
                      {getStatusIcon(returnItem.status || 'pending')}
                      {(returnItem.status || 'pending').charAt(0).toUpperCase() + (returnItem.status || 'pending').slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">Customer: {returnItem.customerName || 'Unknown Customer'}</p>
                  <p className="text-gray-600 mb-1">Order ID: #{(returnItem.orderId || '').slice(0, 8) || 'N/A'}</p>
                  <p className="text-gray-600 mb-2">Date: {returnItem.createdAt?.toLocaleDateString() || 'Unknown Date'}</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Reason:</p>
                    <p className="text-sm text-gray-600">{returnItem.reason || 'No reason provided'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Refund Amount</p>
                    <p className="text-2xl font-bold text-orange-600">₹{(returnItem.amount || 0).toFixed(2)}</p>
                  </div>

                  {(returnItem.status || 'pending') === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmAction({ returnId: returnItem.id, action: 'approve' })}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-lg font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setConfirmAction({ returnId: returnItem.id, action: 'reject' })}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {confirmAction && (
        <ConfirmModal
          title={`${confirmAction.action === 'approve' ? 'Approve' : 'Reject'} Return`}
          message={`Are you sure you want to ${confirmAction.action} this return request?`}
          onConfirm={() => handleStatusUpdate(
            confirmAction.returnId, 
            confirmAction.action === 'approve' ? 'approved' : 'rejected'
          )}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
