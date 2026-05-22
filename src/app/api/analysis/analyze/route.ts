import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chat } from '@/lib/llm';
import { getLLMProvider, getLLMModel, getLLMTemperature, getProviderApiKey } from '@/lib/config-helpers';
import type { AnalysisReport, ReportJson } from '@/types/stock';

const FINANCE_BASE = 'https://internal-api.z.ai/external/finance';

interface FinanceQuoteData {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  trailingPE?: number;
  shortName?: string;
  longName?: string;
}

interface FinanceHistoricalPoint {
  date?: string;
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

async function fetchStockData(ticker: string) {
  const headers = { 'X-Z-AI-From': 'Z' };

  // Fetch quote
  const quoteRes = await fetch(
    `${FINANCE_BASE}/v1/quote?ticker=${encodeURIComponent(ticker)}`,
    { headers }
  );
  const quoteData: FinanceQuoteData = quoteRes.ok
    ? await quoteRes.json()
    : {};

  // Fetch historical data (last 30 days)
  const histRes = await fetch(
    `${FINANCE_BASE}/v1/history?ticker=${encodeURIComponent(ticker)}&range=1mo&interval=1d`,
    { headers }
  );
  let historicalData: FinanceHistoricalPoint[] = [];
  if (histRes.ok) {
    const histJson = await histRes.json();
    historicalData = histJson.body || histJson.results || histJson || [];
  }

  // Fetch financial data modules
  const finRes = await fetch(
    `${FINANCE_BASE}/v1/financials?ticker=${encodeURIComponent(ticker)}&modules=defaultKeyStatistics,financialData`,
    { headers }
  );
  let financialData: Record<string, unknown> = {};
  if (finRes.ok) {
    financialData = await finRes.json();
  }

  return { quoteData, historicalData, financialData };
}

function buildAnalysisPrompt(
  stockCode: string,
  stockName: string,
  quoteData: FinanceQuoteData,
  historicalData: FinanceHistoricalPoint[],
  financialData: Record<string, unknown>
): string {
  const recentPrices = historicalData.slice(-10).map(
    (p) => `${p.date}: O=${p.open ?? '-'} H=${p.high ?? '-'} L=${p.low ?? '-'} C=${p.close ?? '-'} V=${p.volume ?? '-'}`
  );

  return `You are an expert stock market analyst. Analyze the following stock data and provide a comprehensive analysis report.

**Stock**: ${stockName} (${stockCode})

**Current Market Data**:
- Price: $${quoteData.regularMarketPrice ?? 'N/A'}
- Change: ${quoteData.regularMarketChange ?? 'N/A'} (${quoteData.regularMarketChangePercent ?? 'N/A'}%)
- Volume: ${quoteData.regularMarketVolume ?? 'N/A'}
- Market Cap: $${quoteData.marketCap ?? 'N/A'}
- Day High: $${quoteData.regularMarketDayHigh ?? 'N/A'}
- Day Low: $${quoteData.regularMarketDayLow ?? 'N/A'}
- Open: $${quoteData.regularMarketOpen ?? 'N/A'}
- Previous Close: $${quoteData.regularMarketPreviousClose ?? 'N/A'}
- P/E Ratio: ${quoteData.trailingPE ?? 'N/A'}

**Recent Price History** (last 10 sessions):
${recentPrices.length > 0 ? recentPrices.join('\n') : 'No historical data available'}

**Additional Financial Data**:
${JSON.stringify(financialData, null, 2).substring(0, 2000)}

Please provide your analysis as a JSON object with the following structure (and ONLY valid JSON, no markdown fences):
{
  "score": <number 0-100>,
  "trend": "<bullish|bearish|neutral>",
  "operationAdvice": "<buy|sell|hold>",
  "keyPriceLevels": {
    "support": [<number>, <number>],
    "resistance": [<number>, <number>]
  },
  "riskAlerts": ["<risk1>", "<risk2>", ...],
  "positiveCatalysts": ["<catalyst1>", "<catalyst2>", ...],
  "newsSentiment": "<positive|negative|neutral> - <brief explanation>",
  "technicalIndicators": {
    "ma5": <number>,
    "ma10": <number>,
    "ma20": <number>,
    "rsi": <number 0-100>,
    "macd": "<bullish|bearish|neutral>"
  },
  "capitalFlow": {
    "mainNetInflow": <number>,
    "retailNetInflow": <number>
  },
  "summary": "<2-3 sentence executive summary>",
  "detailedReport": "<Markdown formatted detailed analysis report with sections: Overview, Technical Analysis, Fundamental Analysis, Risk Assessment, and Conclusion>"
}

Be thorough, data-driven, and objective. Base your analysis on the provided data.`;
}

function extractJson(text: string): string | null {
  // Try to extract JSON from code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find a JSON object in the text
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return text.substring(braceStart, braceEnd + 1);
  }

  return null;
}

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

    const ticker = stockCode.toUpperCase();
    const name = stockName || stockCode;

    // Step 1: Fetch stock data from finance API
    const { quoteData, historicalData, financialData } =
      await fetchStockData(ticker);

    // Step 2: Build the analysis prompt
    const prompt = buildAnalysisPrompt(
      ticker,
      name,
      quoteData,
      historicalData,
      financialData
    );

    // Step 3: Use LLM to generate analysis
    const providerId = await getLLMProvider('sensenova');
    const selectedModel = await getLLMModel();
    const temperature = await getLLMTemperature(0.7);
    const apiKey = await getProviderApiKey(providerId);
    const rawContent = await chat(
      [{ role: 'user', content: prompt }],
      { model: selectedModel, temperature, providerId, apiKey: apiKey || undefined }
    );
    if (!rawContent) {
      throw new Error('LLM returned empty response');
    }

    // Step 4: Parse LLM response
    const jsonStr = extractJson(rawContent);
    if (!jsonStr) {
      throw new Error('Failed to extract JSON from LLM response');
    }

    let analysisData: Record<string, unknown>;
    try {
      analysisData = JSON.parse(jsonStr);
    } catch {
      throw new Error('LLM response is not valid JSON');
    }

    const reportJson: ReportJson = {
      score: Number(analysisData.score) || 50,
      trend: String(analysisData.trend || 'neutral'),
      operationAdvice: String(analysisData.operationAdvice || 'hold'),
      keyPriceLevels: {
        support: Array.isArray(analysisData.keyPriceLevels?.support)
          ? analysisData.keyPriceLevels.support.map(Number)
          : [],
        resistance: Array.isArray(analysisData.keyPriceLevels?.resistance)
          ? analysisData.keyPriceLevels.resistance.map(Number)
          : [],
      },
      riskAlerts: Array.isArray(analysisData.riskAlerts)
        ? analysisData.riskAlerts.map(String)
        : [],
      positiveCatalysts: Array.isArray(analysisData.positiveCatalysts)
        ? analysisData.positiveCatalysts.map(String)
        : [],
      newsSentiment: String(analysisData.newsSentiment || ''),
      technicalIndicators: {
        ma5: Number(analysisData.technicalIndicators?.ma5) || 0,
        ma10: Number(analysisData.technicalIndicators?.ma10) || 0,
        ma20: Number(analysisData.technicalIndicators?.ma20) || 0,
        rsi: Number(analysisData.technicalIndicators?.rsi) || 50,
        macd: String(analysisData.technicalIndicators?.macd || ''),
      },
      capitalFlow: {
        mainNetInflow: Number(analysisData.capitalFlow?.mainNetInflow) || 0,
        retailNetInflow: Number(analysisData.capitalFlow?.retailNetInflow) || 0,
      },
    };

    const summary = String(analysisData.summary || '');
    const detailedReport = String(analysisData.detailedReport || rawContent);

    // Step 5: Determine trend/advice from data
    const trend = reportJson.trend.toLowerCase();
    const advice = reportJson.operationAdvice.toLowerCase();
    const score = Math.max(0, Math.min(100, reportJson.score));

    // Step 6: Save to database
    const saved = await db.analysis.create({
      data: {
        stockCode: ticker,
        stockName: name,
        market: 'us',
        score,
        trend,
        advice,
        summary,
        report: detailedReport,
        reportJson: JSON.stringify(reportJson),
      },
    });

    // Step 7: Return the analysis report
    const report: AnalysisReport = {
      id: saved.id,
      stockCode: saved.stockCode,
      stockName: saved.stockName ?? name,
      market: saved.market,
      score: saved.score ?? score,
      trend: saved.trend ?? trend,
      advice: saved.advice ?? advice,
      summary: saved.summary ?? summary,
      report: saved.report,
      reportJson,
      createdAt: saved.createdAt.toISOString(),
    };

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
