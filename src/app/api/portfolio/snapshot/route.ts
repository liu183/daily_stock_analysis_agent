import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RawTrade {
  id: string;
  accountId: string;
  symbol: string;
  tradeDate: Date;
  side: string;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  account: { name: string; baseCurrency: string; market: string };
}

interface CalculatedPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  accountId: string;
  accountName: string;
  baseCurrency: string;
  market: string;
}

// FIFO cost calculation
function calculatePositionsFIFO(trades: RawTrade[]): CalculatedPosition[] {
  const lots: Record<string, { accountId: string; accountName: string; baseCurrency: string; market: string; queue: { qty: number; cost: number }[] }> = {};

  // Sort trades chronologically for FIFO
  const sorted = [...trades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());

  for (const trade of sorted) {
    const key = `${trade.accountId}:${trade.symbol}`;
    if (!lots[key]) {
      lots[key] = {
        accountId: trade.accountId,
        accountName: trade.account.name,
        baseCurrency: trade.account.baseCurrency,
        market: trade.account.market,
        queue: [],
      };
    }

    const lot = lots[key];

    if (trade.side === 'buy') {
      // Add to queue
      lot.queue.push({ qty: trade.quantity, cost: trade.price * trade.quantity + trade.fee + trade.tax });
    } else if (trade.side === 'sell') {
      // Remove from queue (FIFO)
      let remaining = trade.quantity;
      while (remaining > 0 && lot.queue.length > 0) {
        const head = lot.queue[0];
        if (head.qty <= remaining) {
          remaining -= head.qty;
          lot.queue.shift();
        } else {
          const ratio = remaining / head.qty;
          head.qty -= remaining;
          head.cost -= head.cost * ratio;
          remaining = 0;
        }
      }
    }
  }

  const positions: CalculatedPosition[] = [];
  for (const [key, lot] of Object.entries(lots)) {
    const [, symbol] = key.split(':');
    const totalQty = lot.queue.reduce((sum, q) => sum + q.qty, 0);
    const totalCost = lot.queue.reduce((sum, q) => sum + q.cost, 0);
    if (totalQty > 0) {
      positions.push({
        symbol,
        quantity: totalQty,
        avgCost: totalCost / totalQty,
        totalCost,
        accountId: lot.accountId,
        accountName: lot.accountName,
        baseCurrency: lot.baseCurrency,
        market: lot.market,
      });
    }
  }

  return positions;
}

// Average cost calculation
function calculatePositionsAVG(trades: RawTrade[]): CalculatedPosition[] {
  const holdings: Record<string, { accountId: string; accountName: string; baseCurrency: string; market: string; totalQty: number; totalCost: number }> = {};

  // Sort trades chronologically
  const sorted = [...trades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());

  for (const trade of sorted) {
    const key = `${trade.accountId}:${trade.symbol}`;
    if (!holdings[key]) {
      holdings[key] = {
        accountId: trade.accountId,
        accountName: trade.account.name,
        baseCurrency: trade.account.baseCurrency,
        market: trade.account.market,
        totalQty: 0,
        totalCost: 0,
      };
    }

    const h = holdings[key];
    const tradeCost = trade.price * trade.quantity + trade.fee + trade.tax;

    if (trade.side === 'buy') {
      h.totalQty += trade.quantity;
      h.totalCost += tradeCost;
    } else if (trade.side === 'sell') {
      const avgCostPerShare = h.totalQty > 0 ? h.totalCost / h.totalQty : 0;
      h.totalQty -= trade.quantity;
      h.totalCost -= avgCostPerShare * trade.quantity;
    }
  }

  const positions: CalculatedPosition[] = [];
  for (const [key, h] of Object.entries(holdings)) {
    const [, symbol] = key.split(':');
    if (h.totalQty > 0) {
      positions.push({
        symbol,
        quantity: h.totalQty,
        avgCost: h.totalCost / h.totalQty,
        totalCost: h.totalCost,
        accountId: h.accountId,
        accountName: h.accountName,
        baseCurrency: h.baseCurrency,
        market: h.market,
      });
    }
  }

  return positions;
}

// Fetch current price from finance API
async function fetchQuote(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://internal-api.z.ai/external/finance/v1/markets/quote?ticker=${encodeURIComponent(symbol)}&type=STOCKS`,
      {
        headers: { 'X-Z-AI-From': 'Z' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Try different response shapes
    if (data?.data?.last) return parseFloat(data.data.last);
    if (data?.last) return parseFloat(data.last);
    if (data?.currentPrice) return parseFloat(data.currentPrice);
    if (data?.price) return parseFloat(data.price);
    if (data?.close) return parseFloat(data.close);
    return null;
  } catch {
    return null;
  }
}

// GET - Portfolio snapshot with calculated positions and current prices
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const costMethod = searchParams.get('costMethod') || 'FIFO';

    // Get accounts to filter
    const accountFilter: Record<string, unknown> = {};
    if (accountId) {
      accountFilter.id = accountId;
    }

    const accounts = await db.portfolioAccount.findMany({
      where: accountFilter,
      select: { id: true, name: true, baseCurrency: true, market: true },
    });

    if (accounts.length === 0) {
      return NextResponse.json({
        totalEquity: 0,
        totalMarketValue: 0,
        totalCash: 0,
        currency: 'CNY',
        accountCount: 0,
        positions: [],
      });
    }

    const accountIds = accounts.map((a) => a.id);

    // Get all trades for the accounts
    const trades = await db.portfolioTrade.findMany({
      where: { accountId: { in: accountIds } },
      include: {
        account: {
          select: { name: true, baseCurrency: true, market: true },
        },
      },
    }) as RawTrade[];

    // Calculate positions based on cost method
    const positions = costMethod === 'AVG'
      ? calculatePositionsAVG(trades)
      : calculatePositionsFIFO(trades);

    if (positions.length === 0) {
      return NextResponse.json({
        totalEquity: 0,
        totalMarketValue: 0,
        totalCash: 0,
        currency: accounts[0]?.baseCurrency || 'CNY',
        accountCount: accounts.length,
        positions: [],
      });
    }

    // Fetch current prices for all symbols (in parallel with batching)
    const uniqueSymbols = [...new Set(positions.map((p) => p.symbol))];
    const priceMap: Record<string, number | null> = {};

    // Fetch prices in parallel (max 5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
      const batch = uniqueSymbols.slice(i, i + batchSize);
      const results = await Promise.all(batch.map((s) => fetchQuote(s)));
      batch.forEach((symbol, idx) => {
        priceMap[symbol] = results[idx];
      });
    }

    // Get cash balances from ledger
    const cashEntries = await db.portfolioCashLedger.findMany({
      where: { accountId: { in: accountIds } },
      select: { direction: true, amount: true, currency: true },
    });

    let totalCash = 0;
    for (const entry of cashEntries) {
      if (entry.direction === 'in') {
        totalCash += entry.amount;
      } else {
        totalCash -= entry.amount;
      }
    }

    // Build final positions with market values and P&L
    let totalMarketValue = 0;
    const finalPositions = positions.map((p) => {
      const lastPrice = priceMap[p.symbol] ?? p.avgCost; // fallback to avg cost if price unavailable
      const marketValue = p.quantity * lastPrice;
      const unrealizedPnl = marketValue - p.totalCost;
      const unrealizedPnlPct = p.totalCost > 0 ? (unrealizedPnl / p.totalCost) * 100 : 0;

      totalMarketValue += marketValue;

      return {
        symbol: p.symbol,
        quantity: Math.round(p.quantity * 10000) / 10000,
        avgCost: Math.round(p.avgCost * 100) / 100,
        lastPrice: Math.round(lastPrice * 100) / 100,
        marketValue: Math.round(marketValue * 100) / 100,
        unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
        unrealizedPnlPct: Math.round(unrealizedPnlPct * 100) / 100,
        accountId: p.accountId,
        accountName: p.accountName,
        valuationCurrency: p.baseCurrency,
      };
    });

    // Sort by market value descending
    finalPositions.sort((a, b) => b.marketValue - a.marketValue);

    return NextResponse.json({
      totalEquity: Math.round((totalMarketValue + totalCash) * 100) / 100,
      totalMarketValue: Math.round(totalMarketValue * 100) / 100,
      totalCash: Math.round(totalCash * 100) / 100,
      currency: accounts[0]?.baseCurrency || 'CNY',
      accountCount: accounts.length,
      positions: finalPositions,
    });
  } catch (error) {
    console.error('Failed to generate snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to generate snapshot' },
      { status: 500 }
    );
  }
}
