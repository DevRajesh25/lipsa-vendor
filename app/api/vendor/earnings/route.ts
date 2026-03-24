import { NextRequest, NextResponse } from 'next/server';
import { getVendorEarnings, getEarningsBreakdown } from '@/services/earningsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const type = searchParams.get('type') || 'summary';

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    if (type === 'breakdown') {
      const breakdown = await getEarningsBreakdown(vendorId);
      return NextResponse.json({ breakdown });
    } else {
      const earnings = await getVendorEarnings(vendorId);
      return NextResponse.json({ earnings });
    }

  } catch (error: any) {
    console.error('Earnings API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}