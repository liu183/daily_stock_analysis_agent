import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AnalysisReport, ReportJson } from '@/types/stock';

// GET /api/analysis/[id] — get single analysis
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const analysis = await db.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let reportJson: ReportJson | null = null;
    try {
      reportJson = analysis.reportJson ? JSON.parse(analysis.reportJson) : null;
    } catch {
      // ignore parse errors
    }

    const report: AnalysisReport = {
      id: analysis.id,
      stockCode: analysis.stockCode,
      stockName: analysis.stockName ?? '',
      market: analysis.market,
      score: analysis.score ?? 0,
      trend: analysis.trend ?? 'neutral',
      advice: analysis.advice ?? 'hold',
      summary: analysis.summary ?? '',
      report: analysis.report,
      reportJson: reportJson ?? {
        score: analysis.score ?? 0,
        trend: analysis.trend ?? 'neutral',
        operationAdvice: analysis.advice ?? 'hold',
        keyPriceLevels: { support: [], resistance: [] },
        riskAlerts: [],
        positiveCatalysts: [],
        newsSentiment: '',
        technicalIndicators: { ma5: 0, ma10: 0, ma20: 0, rsi: 50, macd: '' },
        capitalFlow: { mainNetInflow: 0, retailNetInflow: 0 },
      },
      createdAt: analysis.createdAt.toISOString(),
    };

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/analysis/[id] — delete an analysis
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.analysis.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
