export interface User {
  uid: string;
  email: string;
  role: 'vendor' | 'customer' | 'admin';
  storeName?: string;
  storeDescription?: string;
  storeLogo?: string;
  ownerName?: string; // Owner/Contact person name
  phone?: string; // Phone number
  address?: string; // Store/Business address
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string; // Legacy field for backward compatibility - category name
  categoryId: string; // Firestore category document ID
  categorySlug: string; // URL-friendly category identifier (e.g., "kitchen-accessories")
  categoryName: string; // Display name (e.g., "Kitchen Accessories")
  price: number;
  stock: number;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string; // Customer email address
  customerAddress?: string; // Customer shipping address
  customerPhone?: string; // Customer phone number
  vendorId?: string; // Legacy field - kept for backward compatibility
  vendors: string[]; // Array of vendor IDs for multi-vendor support
  products: OrderProduct[];
  totalAmount: number;
  commission: number;
  vendorAmount: number;
  vendorEarnings?: { [vendorId: string]: number }; // Earnings per vendor
  vendorCommissions?: { [vendorId: string]: number }; // Commission per vendor
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  isPaidOut: boolean; // Track if ALL vendors have been paid
  paidOutVendors?: string[]; // Array of vendor IDs that have been paid
  payoutDetails?: { [vendorId: string]: PayoutDetail }; // Payout details per vendor
  trackingNumber?: string; // Shipping tracking number
  shippingCarrier?: string; // Carrier name (e.g., "Delhivery")
  trackingUrl?: string; // Tracking URL
  stockUpdatesApplied?: boolean; // Track if stock was reduced
  stockRestored?: boolean; // Track if stock was restored (for cancellations)
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutDetail {
  payoutRequestId: string;
  paidAt: Date;
  amount: number;
}

export interface OrderProduct {
  productId: string;
  vendorId: string; // Vendor who owns this product
  name: string;
  price: number;
  quantity: number;
  image?: string; // Product image
}

export interface Settings {
  commissionPercentage: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingPayout: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { [key: string]: string }; // e.g., { size: "M", color: "Red" }
}

export interface ShippingMethod {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  vendorId: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: 'technical' | 'payment' | 'product' | 'account' | 'other';
  createdAt: Date;
  updatedAt: Date;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  ticketId: string;
  message: string;
  isVendor: boolean;
  createdAt: Date;
}

export interface Return {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  productId: string;
  productName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  amount: number;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  vendorId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  vendorReply?: string;
  createdAt: Date;
}

export interface PayoutRequest {
  id: string;
  vendorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  ordersPaidOut?: string[]; // Array of order IDs included in this payout
  totalOrderAmount?: number; // Total amount from orders
  requestedAt: Date;
  processedAt?: Date;
}

export interface Notification {
  id: string;
  vendorId: string;
  title: string;
  message: string;
  type: 'order' | 'approved' | 'rejected' | 'payout' | 'support' | 'return' | 'review' | 'system';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  metadata?: {
    orderId?: string;
    productId?: string;
    returnId?: string;
    reviewId?: string;
    payoutId?: string;
  };
}

export interface InfluencerVideo {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  videoUrl: string;
  thumbnail?: string;
  title: string;
  views: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
