import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminSDKAvailable } from '@/lib/firebase-admin';

/**
 * GET /api/admin/settings - Get platform settings
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdminSDKAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not configured'
      }, { status: 500 });
    }

    const settingsDoc = await adminDb.collection('settings').doc('platform').get();
    
    if (!settingsDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Settings not found'
      }, { status: 404 });
    }

    const settings = settingsDoc.data();

    return NextResponse.json({
      success: true,
      settings: {
        commissionPercentage: settings?.commissionPercentage || 10,
        taxPercentage: settings?.taxPercentage || 18,
        currency: settings?.currency || 'INR',
        currencySymbol: settings?.currencySymbol || '₹',
        platformName: settings?.platformName || 'Multi-Vendor Marketplace'
      }
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch settings'
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings - Update platform settings
 */
export async function PUT(request: NextRequest) {
  try {
    if (!isAdminSDKAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not configured'
      }, { status: 500 });
    }

    const body = await request.json();
    
    // Validate input
    const updates: any = {};
    
    if (body.commissionPercentage !== undefined) {
      const commission = parseFloat(body.commissionPercentage);
      if (isNaN(commission) || commission < 0 || commission > 100) {
        return NextResponse.json({
          success: false,
          error: 'Commission percentage must be between 0 and 100'
        }, { status: 400 });
      }
      updates.commissionPercentage = commission;
    }
    
    if (body.taxPercentage !== undefined) {
      const tax = parseFloat(body.taxPercentage);
      if (isNaN(tax) || tax < 0 || tax > 100) {
        return NextResponse.json({
          success: false,
          error: 'Tax percentage must be between 0 and 100'
        }, { status: 400 });
      }
      updates.taxPercentage = tax;
    }
    
    if (body.currency !== undefined) {
      updates.currency = body.currency;
    }
    
    if (body.currencySymbol !== undefined) {
      updates.currencySymbol = body.currencySymbol;
    }
    
    if (body.platformName !== undefined) {
      updates.platformName = body.platformName;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update'
      }, { status: 400 });
    }

    // Add updated timestamp
    updates.updatedAt = new Date();

    // Update settings
    await adminDb.collection('settings').doc('platform').update(updates);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updates
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update settings'
    }, { status: 500 });
  }
}

/**
 * Example requests:
 * 
 * GET /api/admin/settings
 * 
 * PUT /api/admin/settings
 * Body: {
 *   "commissionPercentage": 12,
 *   "taxPercentage": 18
 * }
 */
