import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stockCode = searchParams.get('stockCode') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const evalWindowDays = searchParams.get('evalWindowDays')
      ? parseInt(searchParams.get('evalWindowDays')!, 10)
      : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);

    const where: Record<string, unknown> = {};

    if (stockCode) {
      where.stockCode = stockCode;
    }
    if (startDate || endDate) {
      where.analysisDate = {};
      if (startDate) {
        (where.analysisDate as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.analysisDate as Record<string, unknown>).lte = new Date(endDate);
      }
    }
    if (status) {
      where.evalStatus = status;
    }
    if (evalWindowDays) {
      where.evalWindowDays = evalWindowDays;
    }

    const [total, items] = await Promise.all([
      db.backtestResult.count({ where }),
      db.backtestResult.findMany({
        where,
        orderBy: { analysisDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Failed to fetch backtest results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backtest results' },
      { status: 500 }
    );
  }
}
