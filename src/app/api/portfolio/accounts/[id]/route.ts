import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE - Delete a portfolio account (cascades trades, cash ledger, corporate actions)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await db.portfolioAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trades: true, cashLedgers: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    await db.portfolioAccount.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Account deleted',
      deletedTrades: account._count.trades,
      deletedCashEntries: account._count.cashLedgers,
    });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
