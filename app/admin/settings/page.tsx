'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader } from 'lucide-react';

interface PlatformSettings {
  commissionPercentage: number;
  taxPercentage: number;
  currency: string;
  currencySymbol: string;
  platformName: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionPercentage: 10,
    taxPercentage: 18,
    currency: 'INR',
    currencySymbol: '₹',
    platformName: 'Multi-Vendor Marketplace'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      } else {
        setMessage({ text: data.error || 'Failed to load settings', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to load settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ text: 'Settings updated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to update settings', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update settings', type: 'error' });
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Platform Settings
            </h1>
            <p className="text-gray-600 mt-1">Manage commission, tax, and platform configuration</p>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Financial Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.commissionPercentage}
                    onChange={(e) => setSettings({ ...settings, commissionPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Platform commission deducted from vendor earnings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.taxPercentage}
                    onChange={(e) => setSettings({ ...settings, taxPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tax added to customer's total (e.g., GST)
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      placeholder="INR"
                      className="px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="text"
                      value={settings.currencySymbol}
                      onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                      placeholder="₹"
                      className="px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Calculation Example</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Product Price: ₹1000</p>
                  <p>Tax ({settings.taxPercentage}%): ₹{(1000 * settings.taxPercentage / 100).toFixed(2)}</p>
                  <p>Customer Pays: ₹{(1000 + (1000 * settings.taxPercentage / 100)).toFixed(2)}</p>
                  <p className="border-t border-blue-300 pt-1 mt-2">Commission ({settings.commissionPercentage}%): ₹{(1000 * settings.commissionPercentage / 100).toFixed(2)}</p>
                  <p className="font-semibold">Vendor Earnings: ₹{(1000 - (1000 * settings.commissionPercentage / 100)).toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
