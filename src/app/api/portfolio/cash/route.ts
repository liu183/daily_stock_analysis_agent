import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List cash ledger entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const where: Record<string, unknown> = {};
    if (accountId) where.accountId = accountId;

    const entries = await db.portfolioCashLedger.findMany({
      where,
      orderBy: { eventDate: 'desc' },
      take: limit,
      include: {
        account: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(
      entries.map((e) => ({
        ...e,
        accountName: e.account.name,
        eventDate: e.eventDate.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Failed to list cash entries:', error);
    return NextResponse.json(
      { error: 'Failed to list cash entries' },
      { status: 500 }
    );
  }
}

// POST - Create a cash ledger entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, eventDate, direction, amount, currency, note } = body;

    if (!accountId || !eventDate || !direction || !amount) {
      return NextResponse.json(
        { error: 'accountId, eventDate, direction, and amount are required' },
        { status: 400 }
      );
    }

    if (direction !== 'in' && direction !== 'out') {
      return NextResponse.json(
        { error: 'direction must be "in" or "out"' },
        { status: 400 }
      );
    }

    const entry = await db.portfolioCashLedger.create({
      data: {
        accountId,
        eventDate: new Date(eventDate),
        direction,
        amount: parseFloat(amount),
        currency: currency || null,
        note: note || null,
      },
      include: {
        account: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(
      {
        ...entry,
        accountName: entry.account.name,
        eventDate: entry.eventDate.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create cash entry:', error);
    return NextResponse.json(
      { error: 'Failed to create cash entry' },
      { status: 500 }
    );
  }
}
