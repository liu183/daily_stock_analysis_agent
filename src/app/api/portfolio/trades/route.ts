import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List trades with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const symbol = searchParams.get('symbol');
    const side = searchParams.get('side');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    const where: Record<string, unknown> = {};

    if (accountId) where.accountId = accountId;
    if (symbol) where.symbol = { contains: symbol.toUpperCase() };
    if (side) where.side = side;
    if (dateFrom || dateTo) {
      where.tradeDate = {};
      if (dateFrom) (where.tradeDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.tradeDate as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [trades, total] = await Promise.all([
      db.portfolioTrade.findMany({
        where,
        orderBy: { tradeDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          account: {
            select: { name: true },
          },
        },
      }),
      db.portfolioTrade.count({ where }),
    ]);

    return NextResponse.json({
      trades: trades.map((t) => ({
        ...t,
        accountName: t.account.name,
        tradeDate: t.tradeDate.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to list trades:', error);
    return NextResponse.json(
      { error: 'Failed to list trades' },
      { status: 500 }
    );
  }
}

// POST - Create a new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, symbol, tradeDate, side, quantity, price, fee, tax, note } = body;

    if (!accountId || !symbol || !tradeDate || !side || !quantity || !price) {
      return NextResponse.json(
        { error: 'accountId, symbol, tradeDate, side, quantity, and price are required' },
        { status: 400 }
      );
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json(
        { error: 'side must be "buy" or "sell"' },
        { status: 400 }
      );
    }

    const trade = await db.portfolioTrade.create({
      data: {
        accountId,
        symbol: symbol.toUpperCase(),
        tradeDate: new Date(tradeDate),
        side,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        fee: parseFloat(fee) || 0,
        tax: parseFloat(tax) || 0,
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
        ...trade,
        accountName: trade.account.name,
        tradeDate: trade.tradeDate.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
