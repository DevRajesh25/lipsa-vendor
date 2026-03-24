import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSDK, isAdminSDKAvailable } from '@/lib/firebase-admin';

/**
 * GET /api/test-admin-sdk - Test Firebase Admin SDK configuration
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK...');

    // Check if Admin SDK is available
    if (!isAdminSDKAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized',
        message: 'Please configure FIREBASE_SERVICE_ACCOUNT_KEY environment variable or use Firebase CLI authentication',
        setupGuide: 'See FIREBASE_ADMIN_SETUP.md for detailed setup instructions'
      }, { status: 500 });
    }

    // Verify Admin SDK connection
    const isWorking = await verifyAdminSDK();

    if (isWorking) {
      return NextResponse.json({
        success: true,
        message: 'Firebase Admin SDK is working correctly',
        timestamp: new Date().toISOString(),
        status: 'ready'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK verification failed',
        message: 'Admin SDK is initialized but cannot connect to Firestore',
        troubleshooting: [
          'Check your Firebase project ID',
          'Verify service account permissions',
          'Ensure Firestore is enabled in your project'
        ]
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Admin SDK test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
      type: 'ADMIN_SDK_ERROR',
      setupGuide: 'See FIREBASE_ADMIN_SETUP.md for setup instructions'
    }, { status: 500 });
  }
}