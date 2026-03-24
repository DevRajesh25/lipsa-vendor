'use client';

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { getVendorNotifications, createNotification } from '@/services/notificationService';
import { Notification } from '@/lib/types';

export default function DebugNotificationsPage() {
  const { vendor, loading } = useVendorAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    if (vendor) {
      loadNotifications();
    }
  }, [vendor]);

  const loadNotifications = async () => {
    if (!vendor) return;
    
    try {
      const fetchedNotifications = await getVendorNotifications(vendor.uid);
      setNotifications(fetchedNotifications);
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    }
  };

  const createTestNotification = async () => {
    if (!vendor) return;
    
    try {
      setTestResult('Creating test notification...');
      
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.uid,
          title: 'Debug Test Notification',
          message: `Test notification created at ${new Date().toLocaleString()} for vendor ${vendor.uid}`,
          type: 'system'
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTestResult(`✅ Test notification created successfully! ID: ${result.notificationId}`);
        // Reload notifications
        setTimeout(loadNotifications, 1000);
      } else {
        setTestResult(`❌ Failed to create notification: ${result.error}`);
      }
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!vendor) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Notifications</h1>
        <p className="text-red-600">No vendor logged in. Please log in as a vendor first.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Notifications System</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Current Vendor Info:</h2>
        <p><strong>Vendor ID:</strong> {vendor.uid}</p>
        <p><strong>Email:</strong> {vendor.email}</p>
        <p><strong>Store Name:</strong> {vendor.storeName}</p>
        <p><strong>Status:</strong> {vendor.status}</p>
      </div>

      <div className="mb-6">
        <button
          onClick={createTestNotification}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Test Notification
        </button>
        {testResult && (
          <div className="mt-2 p-2 bg-gray-100 rounded">
            {testResult}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Notifications for this vendor ({notifications.length} total)
        </h2>
        
        {notifications.length === 0 ? (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-800">
              No notifications found for vendor ID: {vendor.uid}
            </p>
            <p className="text-sm text-yellow-600 mt-2">
              This could mean:
              <br />• No notifications have been created for this vendor
              <br />• There's an issue with the notification service
              <br />• The vendor ID doesn't match any notifications in the database
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${
                  notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    notification.isRead ? 'bg-gray-200' : 'bg-blue-200'
                  }`}>
                    {notification.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{notification.message}</p>
                <div className="text-sm text-gray-500">
                  <p>Type: {notification.type}</p>
                  <p>Created: {notification.createdAt.toLocaleString()}</p>
                  <p>ID: {notification.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}