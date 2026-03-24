import { NextRequest, NextResponse } from 'next/server';
import { 
  createPayoutRequest, 
  getVendorPayoutRequests 
} from '@/services/earningsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const payoutRequests = await getVendorPayoutRequests(vendorId);
    return NextResponse.json({ payoutRequests });

  } catch (error: any) {
    console.error('Payout requests API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, amount, bankDetails } = body;

    if (!vendorId || !amount || !bankDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payoutRequestId = await createPayoutRequest({
      vendorId,
      amount,
      bankDetails
    });

    return NextResponse.json({ 
      success: true, 
      payoutRequestId 
    });

  } catch (error: any) {
    console.error('Create payout request API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payout request' },
      { status: 500 }
    );
  }
}