'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { logoutVendor } from '@/services/authService';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { vendor, loading } = useVendorAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && vendor) {
      // If vendor is approved, redirect to dashboard
      if (vendor.status === 'approved') {
        router.push('/vendor/dashboard');
      }
      // If vendor is rejected, show rejection message
      else if (vendor.status === 'rejected') {
        // Stay on this page to show rejection message
      }
    }
  }, [vendor, loading, router]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await logoutVendor();
      router.push('/vendor/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  const isRejected = vendor?.status === 'rejected';
  const isSuspended = vendor?.status === 'suspended';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 ${isRejected || isSuspended ? 'bg-red-100' : 'bg-yellow-100'} rounded-full mb-4`}>
            {isRejected || isSuspended ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : (
              <Clock className="w-10 h-10 text-yellow-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isSuspended ? 'Account Suspended' : isRejected ? 'Application Rejected' : 'Pending Approval'}
          </h1>
          <p className="text-gray-600">
            {isSuspended 
              ? 'Your vendor account has been suspended'
              : isRejected 
                ? 'Your vendor application has been rejected'
                : 'Your vendor account is awaiting admin approval'
            }
          </p>
        </div>

        {isSuspended ? (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">
                Your vendor account has been suspended by the admin. 
                Please contact support for more information and to resolve this issue.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all shadow-lg font-medium"
              >
                Back to Login
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact support at{' '}
                <a href="mailto:support@example.com" className="text-purple-600 hover:text-purple-700">
                  support@example.com
                </a>
              </p>
            </div>
          </div>
        ) : isRejected ? (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">
                Unfortunately, your vendor application has been rejected by the admin. 
                Please contact support for more information.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all shadow-lg font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    What happens next?
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Admin will review your application</li>
                    <li>• You'll receive an email notification</li>
                    <li>• This usually takes 24-48 hours</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                Your Store Information:
              </p>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Store Name:</strong> {vendor?.storeName}</p>
                <p><strong>Email:</strong> {vendor?.email}</p>
                <p><strong>Status:</strong> <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">Pending</span></p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium disabled:opacity-50"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Check Approval Status
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-medium"
              >
                Logout
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact support at{' '}
                <a href="mailto:support@example.com" className="text-purple-600 hover:text-purple-700">
                  support@example.com
                </a>
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
