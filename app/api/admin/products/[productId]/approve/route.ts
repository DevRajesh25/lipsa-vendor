import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notifyVendorOfProductApproval } from '@/services/notificationHelpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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

    // Update product status to approved
    await updateDoc(productRef, {
      status: 'approved',
      updatedAt: new Date()
    });

    // Create notification for vendor
    try {
      await notifyVendorOfProductApproval(
        productData.vendorId,
        productData.name,
        productId
      );
    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Product approved successfully'
    });

  } catch (error: any) {
    console.error('Product approval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve product' },
      { status: 500 }
    );
  }
}