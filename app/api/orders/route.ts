import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminSDKAvailable } from '@/lib/firebase-admin';
import { getPlatformSettingsServer } from '@/services/settingsService';

// Interface for order creation input
interface CreateOrderInput {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  products: Array<{
    productId: string;
    vendorId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  paymentStatus?: 'pending' | 'paid';
  paymentMethod?: string;
}

/**
 * POST /api/orders - Create a new order with automatic inventory reduction
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAdminSDKAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not configured'
      }, { status: 500 });
    }

    const body = await request.json();
    
    // Validate required fields
    const { customerId, customerName, products, totalAmount } = body;
    
    if (!customerId || !customerName || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customerId, customerName, products'
      }, { status: 400 });
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid total amount'
      }, { status: 400 });
    }

    // Validate product structure
    for (const product of products) {
      if (!product.productId || !product.vendorId || !product.name || !product.price || !product.quantity) {
        return NextResponse.json({
          success: false,
          error: 'Invalid product structure. Each product must have: productId, vendorId, name, price, quantity'
        }, { status: 400 });
      }

      if (product.quantity <= 0) {
        return NextResponse.json({
          success: false,
          error: `Invalid quantity for product ${product.name}`
        }, { status: 400 });
      }
    }

    // Fetch platform settings for commission calculation
    const settings = await getPlatformSettingsServer(adminDb);
    const commissionRate = settings.commissionPercentage / 100; // Convert percentage to decimal

    // Create order with inventory update using Admin SDK transaction
    const orderId = await adminDb.runTransaction(async (transaction: any) => {
      // Get all product documents
      const productRefs = products.map((product: any) => 
        adminDb.collection('products').doc(product.productId)
      );

      const productDocs = await Promise.all(
        productRefs.map(ref => transaction.get(ref))
      );

      // Get all inventory documents (before transaction operations)
      const inventoryRefs: any[] = [];
      for (const product of products) {
        const inventoryQuery = adminDb.collection('inventory')
          .where('productId', '==', product.productId)
          .where('vendorId', '==', product.vendorId)
          .limit(1);
        
        const inventorySnapshot = await inventoryQuery.get();
        
        if (!inventorySnapshot.empty) {
          inventoryRefs.push({
            ref: inventorySnapshot.docs[0].ref,
            data: inventorySnapshot.docs[0].data(),
            quantity: product.quantity
          });
        }
      }

      // Validate stock and prepare updates
      const stockErrors: string[] = [];
      const stockUpdates: Array<{ref: any, newStock: number, productName: string}> = [];

      productDocs.forEach((doc, index) => {
        if (!doc.exists) {
          stockErrors.push(`Product ${products[index].name} not found`);
          return;
        }

        const productData = doc.data();
        const currentStock = productData?.stock || 0;
        const requestedQuantity = products[index].quantity;

        if (productData.status !== 'approved') {
          stockErrors.push(`Product ${products[index].name} is not available for purchase`);
          return;
        }

        if (currentStock < requestedQuantity) {
          stockErrors.push(
            `Insufficient stock for ${products[index].name}. Available: ${currentStock}, Requested: ${requestedQuantity}`
          );
          return;
        }

        // Prepare stock update
        const newStock = currentStock - requestedQuantity;
        stockUpdates.push({
          ref: productRefs[index],
          newStock,
          productName: productData?.name || 'Unknown Product'
        });
      });

      if (stockErrors.length > 0) {
        throw new Error(`Stock validation failed: ${stockErrors.join(', ')}`);
      }

      // Apply stock updates to products
      stockUpdates.forEach(update => {
        console.log(`Reducing product stock: ${update.productName} from ${update.newStock + products.find((p: any) => p.name === update.productName)?.quantity} to ${update.newStock}`);
        transaction.update(update.ref, { 
          stock: update.newStock,
          updatedAt: new Date()
        });
      });

      // Apply stock updates to inventory
      inventoryRefs.forEach(inventory => {
        const currentInventoryStock = inventory.data.stock || 0;
        const newInventoryStock = currentInventoryStock - inventory.quantity;
        console.log(`Reducing inventory stock from ${currentInventoryStock} to ${newInventoryStock} (quantity: ${inventory.quantity})`);
        
        transaction.update(inventory.ref, {
          stock: newInventoryStock,
          updatedAt: new Date()
        });
      });

      // Group products by vendor for multi-vendor support
      const vendorGroups = new Map<string, any[]>();
      const vendorEarnings = new Map<string, number>();
      const vendorCommissions = new Map<string, number>();

      products.forEach((product: any) => {
        const vendorId = product.vendorId;
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, []);
          vendorEarnings.set(vendorId, 0);
          vendorCommissions.set(vendorId, 0);
        }
        
        vendorGroups.get(vendorId)!.push(product);
        
        // Calculate vendor earnings and commission using dynamic commission rate
        // Example: productPrice = ₹900, quantity = 1, commissionRate = 10%
        // productTotal = ₹900
        // commission = ₹90 (commissionRate% of product price)
        // vendorEarning = ₹810 (product price - commission)
        // Note: totalAmount includes tax (e.g., ₹1062 = ₹900 + ₹162 tax)
        // but vendor earnings are calculated on base product price only
        const productTotal = product.price * product.quantity;
        const commission = Math.round(productTotal * commissionRate * 100) / 100;
        const vendorEarning = Math.round((productTotal - commission) * 100) / 100;
        
        vendorEarnings.set(vendorId, 
          Math.round((vendorEarnings.get(vendorId)! + vendorEarning) * 100) / 100
        );
        vendorCommissions.set(vendorId, 
          Math.round((vendorCommissions.get(vendorId)! + commission) * 100) / 100
        );
      });

      // Create order data
      const orderData = {
        customerId,
        customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress,
        products,
        totalAmount, // Total amount customer pays (includes tax)
        commission: Math.round(Array.from(vendorCommissions.values()).reduce((sum, c) => sum + c, 0) * 100) / 100,
        vendorAmount: Math.round(Array.from(vendorEarnings.values()).reduce((sum, e) => sum + e, 0) * 100) / 100,
        vendorEarnings: Object.fromEntries(vendorEarnings), // Per-vendor earnings
        vendorCommissions: Object.fromEntries(vendorCommissions), // Per-vendor commissions
        vendors: Array.from(vendorGroups.keys()),
        orderStatus: 'pending' as const,
        paymentStatus: body.paymentStatus || 'pending',
        paymentMethod: body.paymentMethod,
        isPaidOut: false,
        paidOutVendors: [],
        stockUpdatesApplied: true,
        stockRestored: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create order document
      const orderRef = adminDb.collection('orders').doc();
      transaction.set(orderRef, orderData);

      return orderRef.id;
    });

    // Create notifications for vendors after successful order creation
    try {
      const vendorGroups = new Map<string, any[]>();
      products.forEach((product: any) => {
        const vendorId = product.vendorId;
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, []);
        }
        vendorGroups.get(vendorId)!.push(product);
      });

      // Create notification for each vendor
      const notificationPromises = Array.from(vendorGroups.entries()).map(async ([vendorId, vendorProducts]) => {
        const vendorTotal = vendorProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        const productNames = vendorProducts.map(p => p.name).join(', ');
        
        await adminDb.collection('notifications').add({
          vendorId,
          title: 'New Order Received',
          message: `You have received a new order for ${productNames} (₹${vendorTotal.toLocaleString()})`,
          type: 'order',
          isRead: false,
          createdAt: new Date()
        });
      });

      await Promise.all(notificationPromises);
    } catch (notificationError) {
      console.error('Failed to create order notifications:', notificationError);
      // Don't fail the order if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      orderId,
      data: {
        orderId,
        customerId,
        customerName,
        totalAmount,
        productCount: products.length,
        vendors: [...new Set(products.map((p: any) => p.vendorId))]
      }
    });

  } catch (error: any) {
    console.error('Create order API error:', error);
    
    // Handle specific error types
    if (error.message.includes('Stock validation failed') || 
        error.message.includes('Insufficient stock') ||
        error.message.includes('not available for purchase')) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'STOCK_ERROR'
      }, { status: 409 }); // Conflict status for stock issues
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create order',
      type: 'SERVER_ERROR'
    }, { status: 500 });
  }
}

/**
 * Example request body:
 * {
 *   "customerId": "customer_uid_123",
 *   "customerName": "John Doe",
 *   "customerEmail": "john@example.com",
 *   "customerAddress": "123 Main St, City, State",
 *   "customerPhone": "+1234567890",
 *   "products": [
 *     {
 *       "productId": "product_123",
 *       "vendorId": "vendor_456",
 *       "name": "Product Name",
 *       "price": 900,        // Base product price
 *       "quantity": 1,
 *       "image": "https://example.com/image.jpg"
 *     }
 *   ],
 *   "totalAmount": 1062,     // Total customer pays (900 + 162 tax)
 *   "paymentStatus": "paid"
 * }
 * 
 * Calculation breakdown:
 * - Product price: ₹900
 * - Tax (18%): ₹162
 * - Total amount (customer pays): ₹1062
 * - Commission (10% of product price): ₹90
 * - Vendor earnings: ₹810 (product price - commission)
 */