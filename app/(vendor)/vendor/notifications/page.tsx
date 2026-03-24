'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, Star, DollarSign, AlertCircle, CheckCircle, MessageSquare, XCircle, Settings } from 'lucide-react';
import { Notification } from '@/lib/types';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';
import Toast from '@/components/vendor/Toast';

export default function NotificationsPage() {
  const { vendor } = useVendorAuth();
  const { notifications, unreadCount, loading, error } = useNotifications(vendor?.uid || null);
  const [filterType, setFilterType] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      // No need to update state - real-time listener will handle it
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to mark as read', type: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!vendor) return;
    
    try {
      await markAllNotificationsAsRead(vendor.uid);
      setToast({ message: 'All notifications marked as read', type: 'success' });
      // No need to update state - real-time listener will handle it
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to mark all as read', type: 'error' });
    }
  };

  const filteredNotifications = notifications.filter(notif => 
    filterType === 'all' || notif.type === filterType
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5" />;
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      case 'payout': return <DollarSign className="w-5 h-5" />;
      case 'support': return <MessageSquare className="w-5 h-5" />;
      case 'return': return <AlertCircle className="w-5 h-5" />;
      case 'review': return <Star className="w-5 h-5" />;
      case 'system': return <Settings className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-600';
      case 'approved': return 'bg-green-100 text-green-600';
      case 'rejected': return 'bg-red-100 text-red-600';
      case 'payout': return 'bg-green-100 text-green-600';
      case 'support': return 'bg-purple-100 text-purple-600';
      case 'return': return 'bg-orange-100 text-orange-600';
      case 'review': return 'bg-yellow-100 text-yellow-600';
      case 'system': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-gray-600">
          {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg font-medium"
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'order', 'approved', 'rejected', 'payout', 'support', 'return', 'review', 'system'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
              filterType === type
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {type === 'approved' ? 'Approved' : 
             type === 'rejected' ? 'Rejected' :
             type === 'payout' ? 'Payouts' :
             type === 'support' ? 'Support' :
             type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 cursor-pointer transition-all hover:shadow-xl ${
                notification.isRead ? 'border-gray-300 opacity-75' : 'border-purple-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-sm text-gray-500">{notification.createdAt.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
