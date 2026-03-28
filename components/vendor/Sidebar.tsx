'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, X, Archive, RotateCcw, Tag, Star, DollarSign, Wallet, Bell, Upload, MessageSquare, Video } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { logoutVendor } from '@/services/authService';
import { useVendorAuth } from '@/hooks/useVendorAuth';
import { useOrderCounts } from '@/hooks/useOrderCounts';
import { useReturnCounts } from '@/hooks/useReturnCounts';
import { useVideoCounts } from '@/hooks/useVideoCounts';
import { useLowStockCounts } from '@/hooks/useLowStockCounts';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBell from './NotificationBell';

const menuItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/videos', label: 'Videos', icon: Video },
  { href: '/vendor/inventory', label: 'Inventory', icon: Archive },
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/vendor/returns', label: 'Returns', icon: RotateCcw },
  { href: '/vendor/coupons', label: 'Coupons', icon: Tag },
  { href: '/vendor/reviews', label: 'Reviews', icon: Star },
  { href: '/vendor/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/vendor/payouts', label: 'Payout Requests', icon: Wallet },
  { href: '/vendor/bulk-upload', label: 'Bulk Upload', icon: Upload },
  { href: '/vendor/support', label: 'Support Tickets', icon: MessageSquare },
  { href: '/vendor/notifications', label: 'Notifications', icon: Bell },
  { href: '/vendor/settings', label: 'Store Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { vendor } = useVendorAuth();
  
  // Get counts for badges
  const { newOrdersCount } = useOrderCounts(vendor?.uid || null);
  const { newReturnsCount } = useReturnCounts(vendor?.uid || null);
  const { pendingVideosCount } = useVideoCounts(vendor?.uid || null);
  const { lowStockCount } = useLowStockCounts(vendor?.uid || null);
  const { unreadCount } = useNotifications(vendor?.uid || null, 1);

  // Map menu items to their counts
  const getItemCount = (href: string) => {
    switch (href) {
      case '/vendor/orders':
        return newOrdersCount;
      case '/vendor/returns':
        return newReturnsCount;
      case '/vendor/videos':
        return pendingVideosCount;
      case '/vendor/inventory':
        return lowStockCount;
      case '/vendor/notifications':
        return unreadCount;
      default:
        return 0;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutVendor();
      router.push('/vendor/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-100 rounded-lg"
        >
          {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
        </button>
        
        <h1 className="text-lg font-bold text-gray-800">Vendor Panel</h1>
        
        <NotificationBell vendorId={vendor?.uid || null} />
      </div>

      {/* Overlay for Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Always visible on desktop, toggleable on mobile */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-64 
          bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          overflow-y-auto
        `}
      >
        <div className="flex flex-col min-h-full p-6">
          {/* Logo and Notification Bell */}
          <div className="mb-8 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Vendor Panel
                </h1>
                {vendor?.storeName && (
                  <p className="text-xs text-gray-500 mt-1">{vendor.storeName}</p>
                )}
              </div>
              <div className="hidden lg:block">
                <NotificationBell vendorId={vendor?.uid || null} />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 mb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const count = getItemCount(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl 
                    transition-all duration-200 relative
                    ${isActive
                      ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center
                      ${isActive 
                        ? 'bg-white text-purple-600' 
                        : 'bg-red-500 text-white'
                      }
                    `}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium flex-shrink-0 mt-auto"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
