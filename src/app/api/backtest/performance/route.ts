import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const completed = await db.backtestResult.findMany({
      where: { evalStatus: 'completed' },
    });

    if (completed.length === 0) {
      return NextResponse.json([]);
    }

    // Group by stock
    const stockMap = new Map<
      string,
      {
        stockCode: string;
        stockName: string;
        items: typeof completed;
      }
    >();

    for (const r of completed) {
      const code = r.stockCode;
      if (!stockMap.has(code)) {
        stockMap.set(code, {
          stockCode: code,
          stockName: r.stockName || code,
          items: [],
        });
      }
      stockMap.get(code)!.items.push(r);
    }

    const perStock = Array.from(stockMap.values()).map((group) => {
      const items = group.items;
      const total = items.length;
      const correct = items.filter((r) => r.directionCorrect === true).length;
      const wins = items.filter((r) => r.outcome === 'win').length;
      const losses = items.filter((r) => r.outcome === 'loss').length;
      const neutrals = items.filter((r) => r.outcome === 'neutral').length;
      const avgReturn =
        items.reduce((sum, r) => sum + (r.actualReturnPct ?? 0), 0) / total;

      return {
        stockCode: group.stockCode,
        stockName: group.stockName,
        total,
        directionAccuracyPct:
          total > 0 ? Math.round((correct / total) * 10000) / 100 : 0,
        winRatePct: total > 0 ? Math.round((wins / total) * 10000) / 100 : 0,
        avgReturnPct: Math.round(avgReturn * 100) / 100,
        winCount: wins,
        lossCount: losses,
        neutralCount: neutrals,
      };
    });

    // Also return overall metrics
    const total = completed.length;
    const correct = completed.filter((r) => r.directionCorrect === true).length;
    const wins = completed.filter((r) => r.outcome === 'win').length;
    const losses = completed.filter((r) => r.outcome === 'loss').length;
    const neutrals = completed.filter((r) => r.outcome === 'neutral').length;
    const avgReturn =
      completed.reduce((sum, r) => sum + (r.actualReturnPct ?? 0), 0) / total;

    return NextResponse.json({
      overall: {
        directionAccuracyPct:
          total > 0 ? Math.round((correct / total) * 10000) / 100 : 0,
        winRatePct: total > 0 ? Math.round((wins / total) * 10000) / 100 : 0,
        avgReturnPct: Math.round(avgReturn * 100) / 100,
        totalEvaluations: total,
        winCount: wins,
        lossCount: losses,
        neutralCount: neutrals,
      },
      perStock,
    });
  } catch (error) {
    console.error('Failed to fetch performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance' },
      { status: 500 }
    );
  }
}
