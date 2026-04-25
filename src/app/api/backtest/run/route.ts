import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getStockHistory } from '@/lib/finance-api';

export async function GET() {
  try {
    const results = await db.backtestResult.findMany({
      where: { evalStatus: 'completed' },
    });

    if (results.length === 0) {
      return NextResponse.json({
        directionAccuracyPct: 0,
        winRatePct: 0,
        avgSimulatedReturnPct: 0,
        avgStockReturnPct: 0,
        stopLossTriggerRate: 0,
        takeProfitTriggerRate: 0,
        completedCount: 0,
        totalEvaluations: 0,
        winCount: 0,
        lossCount: 0,
        neutralCount: 0,
        evalWindowDays: 10,
      });
    }

    const completed = results;
    const directionCorrect = completed.filter((r) => r.directionCorrect === true).length;
    const total = completed.length;

    const wins = completed.filter((r) => r.outcome === 'win').length;
    const losses = completed.filter((r) => r.outcome === 'loss').length;
    const neutrals = completed.filter((r) => r.outcome === 'neutral').length;

    const avgReturn =
      completed.reduce((sum, r) => sum + (r.actualReturnPct ?? 0), 0) / total;

    const allResults = await db.backtestResult.findMany();
    const evalWindowDays = completed[0]?.evalWindowDays ?? 10;

    return NextResponse.json({
      directionAccuracyPct:
        total > 0 ? Math.round((directionCorrect / total) * 10000) / 100 : 0,
      winRatePct: total > 0 ? Math.round((wins / total) * 10000) / 100 : 0,
      avgSimulatedReturnPct: Math.round(avgReturn * 100) / 100,
      avgStockReturnPct: Math.round(avgReturn * 100) / 100,
      stopLossTriggerRate:
        total > 0
          ? Math.round((completed.filter((r) => r.outcome === 'loss').length / total) * 10000) / 100
          : 0,
      takeProfitTriggerRate:
        total > 0
          ? Math.round((completed.filter((r) => r.outcome === 'win').length / total) * 10000) / 100
          : 0,
      completedCount: completed.length,
      totalEvaluations: allResults.length,
      winCount: wins,
      lossCount: losses,
      neutralCount: neutrals,
      evalWindowDays,
    });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      forceRerun = false,
      evalWindowDays = 10,
      stockCode,
      startDate,
      endDate,
    } = body;

    // Fetch analyses that haven't been backtested yet (or force rerun)
    const where: Record<string, unknown> = {
      trend: { not: null },
    };

    if (stockCode) {
      where.stockCode = stockCode;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    if (!forceRerun) {
      const existingBacktests = await db.backtestResult.findMany({
        select: { analysisId: true },
      });
      const existingIds = existingBacktests
        .map((b) => b.analysisId)
        .filter(Boolean);
      if (existingIds.length > 0) {
        where.id = { notIn: existingIds };
      }
    }

    const analyses = await db.analysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (analyses.length === 0) {
      return NextResponse.json({
        processed: 0,
        saved: 0,
        completed: 0,
        insufficient: 0,
        errors: 0,
      });
    }

    let saved = 0;
    let completed = 0;
    let insufficient = 0;
    let errors = 0;

    for (const analysis of analyses) {
      try {
        // Parse the reportJson to get predicted direction
        let directionExpected: string | undefined;
        let operationAdvice = analysis.advice;
        let trendPrediction = analysis.trend;

        if (analysis.reportJson) {
          try {
            const parsed = JSON.parse(analysis.reportJson);
            if (parsed.trend) trendPrediction = parsed.trend;
            if (parsed.operationAdvice) operationAdvice = parsed.operationAdvice;
          } catch {
            // ignore JSON parse errors
          }
        }

        // Determine expected direction from trend
        if (trendPrediction === 'bullish') {
          directionExpected = 'up';
        } else if (trendPrediction === 'bearish') {
          directionExpected = 'down';
        } else {
          directionExpected = 'flat';
        }

        // Fetch historical price data to get actual movement
        const analysisDate = new Date(analysis.createdAt);
        const fromRange = Math.ceil(evalWindowDays * 1.5); // fetch more days to account for weekends
        const fromDate = new Date(analysisDate);
        fromDate.setDate(fromDate.getDate() - 2); // 2 days before as buffer
        const toDate = new Date(analysisDate);
        toDate.setDate(toDate.getDate() + fromRange + 5);

        let actualReturnPct: number | null = null;
        let actualMovement: 'up' | 'down' | 'flat' | null = null;
        let directionCorrect: boolean | null = null;
        let outcome: 'win' | 'loss' | 'neutral' | null = null;

        try {
          const historyData = await getStockHistory(
            analysis.stockCode,
            '1d',
            `${Math.ceil(fromRange + 10)}d`
          );

          // Find the price data around the analysis date
          // The history API returns candles, we need to find the right window
          if (
            historyData &&
            typeof historyData === 'object' &&
            'body' in historyData
          ) {
            const body = (historyData as { body?: unknown }).body;
            if (body && typeof body === 'object') {
              const candles = (body as { candles?: Array<{ date?: string; close?: number }> }).candles;
              if (Array.isArray(candles) && candles.length > 1) {
                // Find candle closest to analysis date as entry
                const analysisDateStr = analysisDate.toISOString().split('T')[0];
                const entryIdx = candles.findIndex(
                  (c) => c.date && c.date.startsWith(analysisDateStr)
                );

                if (entryIdx >= 0 && entryIdx + evalWindowDays < candles.length) {
                  const entryPrice = candles[entryIdx].close ?? 0;
                  const exitPrice =
                    candles[entryIdx + evalWindowDays].close ??
                    candles[candles.length - 1].close ??
                    entryPrice;

                  actualReturnPct =
                    entryPrice > 0
                      ? Math.round(((exitPrice - entryPrice) / entryPrice) * 10000) / 100
                      : null;

                  // Determine actual movement
                  if (actualReturnPct !== null) {
                    if (actualReturnPct > 1) {
                      actualMovement = 'up';
                    } else if (actualReturnPct < -1) {
                      actualMovement = 'down';
                    } else {
                      actualMovement = 'flat';
                    }
                  }

                  // Check direction correctness
                  if (directionExpected && actualMovement) {
                    if (actualMovement === 'flat') {
                      directionCorrect = directionExpected === 'flat';
                    } else {
                      directionCorrect = directionExpected === actualMovement;
                    }
                  }

                  // Determine outcome
                  if (directionCorrect === true && actualReturnPct !== null) {
                    if (actualReturnPct > 3) {
                      outcome = 'win';
                    } else if (actualReturnPct > 0) {
                      outcome = 'win';
                    } else {
                      outcome = 'neutral';
                    }
                  } else if (directionCorrect === false && actualReturnPct !== null) {
                    if (actualReturnPct < -3) {
                      outcome = 'loss';
                    } else if (actualReturnPct < 0) {
                      outcome = 'loss';
                    } else {
                      outcome = 'neutral';
                    }
                  } else {
                    outcome = 'neutral';
                  }
                }
              }
            }
          }

          if (actualReturnPct === null) {
            insufficient++;
          } else {
            completed++;
          }
        } catch (priceErr) {
          console.error(
            `Failed to fetch price for ${analysis.stockCode}:`,
            priceErr
          );
          insufficient++;
        }

        // Upsert backtest result
        await db.backtestResult.upsert({
          where: { analysisId: analysis.id },
          update: {
            stockCode: analysis.stockCode,
            stockName: analysis.stockName,
            analysisDate: analysis.createdAt,
            trendPrediction,
            operationAdvice,
            directionExpected,
            actualReturnPct,
            actualMovement,
            directionCorrect,
            outcome,
            evalStatus:
              actualReturnPct !== null ? 'completed' : 'insufficient',
            evalWindowDays,
          },
          create: {
            analysisId: analysis.id,
            stockCode: analysis.stockCode,
            stockName: analysis.stockName,
            analysisDate: analysis.createdAt,
            trendPrediction,
            operationAdvice,
            directionExpected,
            actualReturnPct,
            actualMovement,
            directionCorrect,
            outcome,
            evalStatus:
              actualReturnPct !== null ? 'completed' : 'insufficient',
            evalWindowDays,
          },
        });

        saved++;
      } catch (err) {
        console.error(`Error processing analysis ${analysis.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({
      processed: analyses.length,
      saved,
      completed,
      insufficient,
      errors,
    });
  } catch (error) {
    console.error('Failed to run backtest:', error);
    return NextResponse.json(
      { error: 'Failed to run backtest' },
      { status: 500 }
    );
  }
}
