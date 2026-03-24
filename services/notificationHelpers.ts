import { 
  createOrderNotification,
  createProductApprovedNotification,
  createProductRejectedNotification,
  createPayoutProcessedNotification,
  createSupportReplyNotification,
  createReturnNotification,
  createReviewNotification,
  createSystemNotification
} from './notificationService';

/**
 * Helper functions to create notifications for various events
 * These should be called from the respective services when events occur
 */

// Call this when a new order is created
export const notifyVendorOfNewOrder = async (
  vendorId: string, 
  productName: string,
  orderAmount: number,
  orderId?: string
): Promise<void> => {
  try {
    await createOrderNotification(
      vendorId, 
      `${productName} (₹${orderAmount.toLocaleString()})`,
      orderId
    );
  } catch (error) {
    console.error('Failed to create order notification:', error);
    // Don't throw - notifications shouldn't break the main flow
  }
};

// Call this when admin approves a product
export const notifyVendorOfProductApproval = async (
  vendorId: string,
  productName: string,
  productId?: string
): Promise<void> => {
  try {
    await createProductApprovedNotification(vendorId, productName, productId);
  } catch (error) {
    console.error('Failed to create product approval notification:', error);
  }
};

// Call this when admin rejects a product
export const notifyVendorOfProductRejection = async (
  vendorId: string,
  productName: string,
  reason?: string,
  productId?: string
): Promise<void> => {
  try {
    await createProductRejectedNotification(vendorId, productName, reason, productId);
  } catch (error) {
    console.error('Failed to create product rejection notification:', error);
  }
};

// Call this when a payout is processed
export const notifyVendorOfPayoutProcessed = async (
  vendorId: string,
  amount: number,
  payoutId?: string
): Promise<void> => {
  try {
    await createPayoutProcessedNotification(vendorId, amount, payoutId);
  } catch (error) {
    console.error('Failed to create payout notification:', error);
  }
};

// Call this when admin replies to a support ticket
export const notifyVendorOfSupportReply = async (
  vendorId: string,
  ticketSubject: string
): Promise<void> => {
  try {
    await createSupportReplyNotification(vendorId, ticketSubject);
  } catch (error) {
    console.error('Failed to create support reply notification:', error);
  }
};

// Call this when a customer requests a return
export const notifyVendorOfReturn = async (
  vendorId: string,
  productName: string,
  returnId?: string
): Promise<void> => {
  try {
    await createReturnNotification(vendorId, productName, returnId);
  } catch (error) {
    console.error('Failed to create return notification:', error);
  }
};

// Call this when a customer leaves a review
export const notifyVendorOfReview = async (
  vendorId: string,
  productName: string,
  rating: number,
  reviewId?: string
): Promise<void> => {
  try {
    await createReviewNotification(vendorId, productName, rating, reviewId);
  } catch (error) {
    console.error('Failed to create review notification:', error);
  }
};

// Call this for system-wide announcements
export const notifyVendorOfSystemMessage = async (
  vendorId: string,
  title: string,
  message: string
): Promise<void> => {
  try {
    await createSystemNotification(vendorId, title, message);
  } catch (error) {
    console.error('Failed to create system notification:', error);
  }
};

/**
 * Example usage in services:
 * 
 * // In orderService.ts - when creating an order
 * import { notifyVendorOfNewOrder } from './notificationHelpers';
 * 
 * // After order is created successfully
 * for (const product of orderProducts) {
 *   await notifyVendorOfNewOrder(
 *     product.vendorId, 
 *     product.name, 
 *     product.price * product.quantity
 *   );
 * }
 * 
 * // In admin panel - when approving products
 * import { notifyVendorOfProductApproval } from './notificationHelpers';
 * 
 * // After updating product status to 'approved'
 * await notifyVendorOfProductApproval(product.vendorId, product.name);
 * 
 * // In payoutService.ts - when processing payouts
 * import { notifyVendorOfPayoutProcessed } from './notificationHelpers';
 * 
 * // After payout is processed
 * await notifyVendorOfPayoutProcessed(vendorId, payoutAmount);
 */