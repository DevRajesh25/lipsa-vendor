'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function VendorAuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Account Not Found</h1>
          <p className="text-gray-600 mt-2">
            This account is not registered as a vendor
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If you logged in with an existing account, you need to register it as a vendor account first.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/vendor/auth/register"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Register as Vendor
          </Link>

          <button
            onClick={() => router.push('/vendor/auth/login')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Troubleshooting:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
            <li>Make sure you registered using the vendor registration form</li>
            <li>Check that you're using the correct email address</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
