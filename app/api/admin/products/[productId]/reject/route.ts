import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notifyVendorOfProductRejection } from '@/services/notificationHelpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { reason } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get product details first
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productData = productSnap.data();

    // Update product status to rejected
    await updateDoc(productRef, {
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date()
    });

    // Create notification for vendor
    try {
      await notifyVendorOfProductRejection(
        productData.vendorId,
        productData.name,
        reason,
        productId
      );
    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Product rejected successfully'
    });

  } catch (error: any) {
    console.error('Product rejection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject product' },
      { status: 500 }
    );
  }
}