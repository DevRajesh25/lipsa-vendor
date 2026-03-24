'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAllPayoutRequests } from '@/services/earningsService';
import { processPayout } from '@/services/payoutService';
import { PayoutRequest } from '@/lib/types';

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'completed' | 'rejected'>('completed');
  const [adminNotes, setAdminNotes] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPayoutRequests();
    }
  }, [user]);

  const loadPayoutRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const requests = await getAllPayoutRequests();
      setPayoutRequests(requests);
    } catch (err: any) {
      console.error('Error loading payout requests:', err);
      setError(err.message || 'Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(selectedRequest.id);
      setError(null);

      await processPayout(
        selectedRequest.id,
        processAction,
        adminNotes || undefined,
        transactionId || undefined
      );

      // Reset form and reload data
      setShowProcessModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      setTransactionId('');
      await loadPayoutRequests();

    } catch (err: any) {
      console.error('Error processing payout:', err);
      setError(err.message || 'Failed to process payout');
    } finally {
      setProcessing(null);
    }
  };

  const openProcessModal = (request: PayoutRequest, action: 'completed' | 'rejected') => {
    setSelectedRequest(request);
    setProcessAction(action);
    setShowProcessModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Access denied. Admin privileges required.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow">
              <div className="h-16 bg-gray-200 rounded-t-lg"></div>
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <button 
            onClick={loadPayoutRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Requests</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {payoutRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Processing</h3>
            <p className="text-2xl font-bold text-blue-600">
              {payoutRequests.filter(r => r.status === 'processing').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
            <p className="text-2xl font-bold text-green-600">
              {payoutRequests.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h3>
            <p className="text-2xl font-bold text-gray-900">
              ₹{payoutRequests
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payout Requests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Payout Requests</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payoutRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No payout requests found
                    </td>
                  </tr>
                ) : (
                  payoutRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{request.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.vendorId.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{request.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs">
                          <p className="font-medium">{request.bankDetails.accountName}</p>
                          <p className="text-xs">{request.bankDetails.bankName}</p>
                          <p className="text-xs">****{request.bankDetails.accountNumber.slice(-4)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openProcessModal(request, 'completed')}
                              disabled={processing === request.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openProcessModal(request, 'rejected')}
                              disabled={processing === request.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Payout Modal */}
        {showProcessModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {processAction === 'completed' ? 'Approve' : 'Reject'} Payout Request
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Request ID: #{selectedRequest.id.slice(-8)}
                </p>
                <p className="text-sm text-gray-600">
                  Amount: ₹{selectedRequest.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Vendor: {selectedRequest.vendorId.slice(-8)}
                </p>
              </div>

              {processAction === 'completed' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter transaction ID"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleProcessPayout}
                  disabled={processing === selectedRequest.id}
                  className={`px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                    processAction === 'completed' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing === selectedRequest.id ? 'Processing...' : 
                   processAction === 'completed' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowProcessModal(false);
                    setSelectedRequest(null);
                    setAdminNotes('');
                    setTransactionId('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}