import { NextRequest, NextResponse } from 'next/server';
import { getAllPayoutRequests } from '@/services/earningsService';
import { processPayout } from '@/services/payoutService';

export async function GET(request: NextRequest) {
  try {
    const payoutRequests = await getAllPayoutRequests();
    return NextResponse.json({ payoutRequests });

  } catch (error: any) {
    console.error('Admin payout requests API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout requests' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { payoutId, status, adminNotes, transactionId } = body;

    if (!payoutId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await processPayout(payoutId, status, adminNotes, transactionId);

    return NextResponse.json({ 
      success: true,
      message: `Payout ${status} successfully`
    });

  } catch (error: any) {
    console.error('Process payout API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payout' },
      { status: 500 }
    );
  }
}