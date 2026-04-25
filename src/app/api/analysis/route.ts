import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { HistoryItem } from '@/types/stock';

// GET /api/analysis — list history
export async function GET() {
  try {
    const analyses = await db.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const items: HistoryItem[] = analyses.map((a) => ({
      id: a.id,
      stockCode: a.stockCode,
      stockName: a.stockName ?? '',
      score: a.score ?? 0,
      trend: a.trend ?? 'neutral',
      advice: a.advice ?? 'hold',
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json(items);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/analysis — create a new (stub) analysis entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stockCode, stockName } = body;

    if (!stockCode) {
      return NextResponse.json(
        { error: 'stockCode is required' },
        { status: 400 }
      );
    }

    const analysis = await db.analysis.create({
      data: {
        stockCode,
        stockName: stockName ?? '',
        market: 'us',
        report: '',
        summary: '',
      },
    });

    return NextResponse.json(analysis, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
