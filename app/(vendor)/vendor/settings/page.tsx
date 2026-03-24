'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  CreditCard, 
  Save, 
  User, 
  Phone, 
  MapPin, 
  Camera, 
  Lock, 
  Eye, 
  EyeOff,
  Upload,
  X
} from 'lucide-react';
import Toast from '@/components/vendor/Toast';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  updateVendorSettings, 
  updateVendorLogo, 
  changeVendorPassword, 
  uploadVendorLogo,
  VendorSettingsData,
  PasswordChangeData 
} from '@/services/vendorSettingsService';

export default function SettingsPage() {
  const { vendor, refreshVendor } = useVendorAuth();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<VendorSettingsData>({
    storeName: '',
    storeDescription: '',
    ownerName: '',
    phone: '',
    address: '',
    storeLogo: ''
  });

  const [bankData, setBankData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (vendor) {
      setFormData({
        storeName: vendor.storeName || '',
        storeDescription: vendor.storeDescription || '',
        ownerName: vendor.ownerName || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        storeLogo: vendor.storeLogo || ''
      });

      setBankData({
        accountName: vendor.bankDetails?.accountName || '',
        accountNumber: vendor.bankDetails?.accountNumber || '',
        bankName: vendor.bankDetails?.bankName || '',
      });
    }
  }, [vendor]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setLoading(true);
    try {
      await updateVendorSettings(vendor.uid, formData);
      
      // Also update bank details
      const vendorRef = doc(db, 'vendors', vendor.uid);
      await updateDoc(vendorRef, {
        bankDetails: {
          accountName: bankData.accountName,
          accountNumber: bankData.accountNumber,
          bankName: bankData.bankName,
        },
        updatedAt: serverTimestamp()
      });

      await refreshVendor();
      setToast({ message: 'Settings updated successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vendor) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select a valid image file', type: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Image size should be less than 5MB', type: 'error' });
      return;
    }

    setLogoUploading(true);
    try {
      const logoUrl = await uploadVendorLogo(file);
      await updateVendorLogo(vendor.uid, logoUrl);
      
      setFormData(prev => ({ ...prev, storeLogo: logoUrl }));
      await refreshVendor();
      
      // Show different message based on upload type
      const isCloudinaryConfigured = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const message = isCloudinaryConfigured 
        ? 'Logo updated successfully' 
        : 'Logo updated successfully (using fallback storage)';
      
      setToast({ message, type: 'success' });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      setToast({ 
        message: error.message || 'Failed to upload logo. Please check your Cloudinary configuration.', 
        type: 'error' 
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setToast({ message: 'New password must be at least 6 characters long', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    try {
      await changeVendorPassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
      setToast({ message: 'Password changed successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to change password', type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const removeLogo = async () => {
    if (!vendor) return;
    
    try {
      await updateVendorLogo(vendor.uid, '');
      setFormData(prev => ({ ...prev, storeLogo: '' }));
      await refreshVendor();
      setToast({ message: 'Logo removed successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to remove logo', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your store settings and preferences</p>
      </div>

      {/* Store Information */}
      <form onSubmit={handleSettingsSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Store Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="My Awesome Store"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="John Doe"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Description
              </label>
              <textarea
                value={formData.storeDescription}
                onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Tell customers about your store..."
              />
            </div>
          </div>
        </motion.div>

        {/* Contact Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="+91XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={vendor?.email || ''}
                disabled
                className="w-full px-4 py-3 text-gray-500 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed"
                placeholder="vendor@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Store Address *
              </label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Enter your complete store address..."
              />
            </div>
          </div>
        </motion.div>

        {/* Store Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Camera className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Store Logo</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.storeLogo ? (
                <div className="relative">
                  <img
                    src={formData.storeLogo}
                    alt="Store Logo"
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {logoUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {logoUploading ? 'Uploading...' : 'Upload Logo'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: 200x200px, Max size: 5MB, Formats: JPG, PNG
                {!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
                  <span className="block text-orange-600 mt-1">
                    ⚠️ Cloudinary not configured - using fallback storage
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bank Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Bank Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <input
                type="text"
                value={bankData.accountName}
                onChange={(e) => setBankData({ ...bankData, accountName: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="State Bank of India"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="1234567890"
              />
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Password Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-xl">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Password Settings</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg font-medium disabled:opacity-50"
            >
              {passwordLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}