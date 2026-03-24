'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { PayoutRequest } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { 
  getVendorEarnings, 
  getVendorPayoutRequests,
  createPayoutRequest,
  VendorEarnings 
} from '@/services/earningsService';
import Toast from '@/components/vendor/Toast';

export default function PayoutsPage() {
  const { vendor } = useVendorAuth();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (vendor) {
      loadPayouts();
      loadPendingAmount();
    }
  }, [vendor]);

  const loadPayouts = async () => {
    if (!vendor) return;
    
    try {
      setLoading(true);
      const fetchedPayouts = await getVendorPayoutRequests(vendor.uid);
      setPayouts(fetchedPayouts);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to load payouts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingAmount = async () => {
    if (!vendor) return;
    
    try {
      const earnings = await getVendorEarnings(vendor.uid);
      setPendingAmount(earnings.availableBalance);
    } catch (error: any) {
      console.error('Failed to load pending amount:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!vendor || !vendor.bankDetails) {
      setToast({ message: 'Please add bank details in settings first', type: 'error' });
      return;
    }

    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Please enter a valid amount', type: 'error' });
      return;
    }

    if (amount > pendingAmount) {
      setToast({ message: 'Amount exceeds available balance', type: 'error' });
      return;
    }

    if (!vendor.bankDetails || !vendor.bankDetails.accountName || !vendor.bankDetails.accountNumber || !vendor.bankDetails.bankName) {
      setToast({ message: 'Please complete your bank details in profile settings first', type: 'error' });
      return;
    }

    try {
      await createPayoutRequest({
        vendorId: vendor.uid,
        amount,
        bankDetails: {
          accountName: vendor.bankDetails.accountName,
          accountNumber: vendor.bankDetails.accountNumber,
          bankName: vendor.bankDetails.bankName
        }
      });
      setToast({ message: 'Payout request submitted successfully', type: 'success' });
      setShowRequestModal(false);
      setRequestAmount('');
      loadPayouts();
      loadPendingAmount();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to create payout request', type: 'error' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <DollarSign className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payout Requests</h1>
          <p className="text-gray-600 mt-1">Request withdrawals from your earnings</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium"
        >
          <Plus className="w-5 h-5" />
          Request Payout
        </button>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8" />
          <h2 className="text-xl font-semibold">Available Balance</h2>
        </div>
        <p className="text-5xl font-bold mb-2">₹{pendingAmount.toFixed(2)}</p>
        <p className="text-sm opacity-90">Ready to withdraw</p>
      </div>

      {payouts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No payout requests yet</p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Request Your First Payout
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout, index) => (
            <motion.div
              key={payout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Payout #{payout.id.slice(0, 8)}</h3>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(payout.status)}`}>
                      {getStatusIcon(payout.status)}
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">Requested: {payout.requestedAt.toLocaleDateString()}</p>
                  {payout.processedAt && (
                    <p className="text-gray-600">Processed: {payout.processedAt.toLocaleDateString()}</p>
                  )}
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Bank Details:</p>
                    <p className="text-sm text-gray-600">{payout.bankDetails.accountName}</p>
                    <p className="text-sm text-gray-600">{payout.bankDetails.bankName}</p>
                    <p className="text-sm text-gray-600">Account: {payout.bankDetails.accountNumber}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-3xl font-bold text-purple-600">₹{payout.amount.toFixed(2)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Payout</h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">₹{pendingAmount.toFixed(2)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <input
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>

            {vendor?.bankDetails && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Payout will be sent to:</p>
                <p className="text-sm text-gray-600">{vendor.bankDetails.accountName}</p>
                <p className="text-sm text-gray-600">{vendor.bankDetails.bankName}</p>
                <p className="text-sm text-gray-600">Account: {vendor.bankDetails.accountNumber}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRequestPayout}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-medium"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestAmount('');
                }}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
