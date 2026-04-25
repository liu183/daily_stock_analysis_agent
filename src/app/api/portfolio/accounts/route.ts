import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all portfolio accounts
export async function GET() {
  try {
    const accounts = await db.portfolioAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { trades: true, cashLedgers: true },
        },
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to list accounts:', error);
    return NextResponse.json(
      { error: 'Failed to list accounts' },
      { status: 500 }
    );
  }
}

// POST - Create a new portfolio account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, broker, market, baseCurrency } = body;

    if (!name || !market || !baseCurrency) {
      return NextResponse.json(
        { error: 'name, market, and baseCurrency are required' },
        { status: 400 }
      );
    }

    const account = await db.portfolioAccount.create({
      data: {
        name,
        broker: broker || 'Demo',
        market,
        baseCurrency,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
