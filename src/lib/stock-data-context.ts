/**
 * Extracts stock codes from chat messages and fetches relevant stock data
 * for LLM context.
 */

const FINANCE_BASE = 'https://internal-api.z.ai/external/finance';
const FINANCE_HEADERS = { 'X-Z-AI-From': 'Z' };

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
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  averageDailyVolume3Month?: number;
}

interface FinanceHistoricalPoint {
  date?: string;
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

/**
 * Extract potential stock codes/tickers from a message.
 * Handles patterns like: 600519, sh600519, sz000001, AAPL, hk00700, etc.
 */
export function extractStockCodes(message: string): string[] {
  const codes: Set<string> = new Set();

  // Match HK stock codes: hk00700, HK00700
  const hkMatch = message.match(/hk\d{5}/gi);
  if (hkMatch) hkMatch.forEach((m) => codes.add(m.toUpperCase()));

  // Match SH/SZ prefixed: sh600519, sz000001
  const shszMatch = message.match(/[sz]\d{6}/gi);
  if (shszMatch) shszMatch.forEach((m) => codes.add(m.toUpperCase()));

  // Match pure 6-digit Chinese stock codes
  const cnMatch = message.match(/(?<![a-zA-Z])\d{6}(?![a-zA-Z.])/g);
  if (cnMatch) {
    cnMatch.forEach((m) => {
      const num = parseInt(m, 10);
      // 600xxx-689xxx = Shanghai A-share
      // 000xxx-004xxx = Shenzhen A-share
      // 300xxx-301xxx = Shenzhen ChiNext
      if ((num >= 600000 && num <= 689999) ||
          (num >= 0 && num <= 499) ||
          (num >= 300000 && num <= 301999)) {
        // Determine prefix
        if (num >= 300000) {
          codes.add(`SZ${m}`);
        } else if (num >= 600000) {
          codes.add(`SH${m}`);
        } else if (num >= 0 && num <= 499) {
          codes.add(`SZ${m.padStart(6, '0')}`);
        }
      }
    });
  }

  // Match US stock tickers (2-5 uppercase letters)
  const usMatch = message.match(/(?<![a-zA-Z.])\b[A-Z]{2,5}\b(?![a-zA-Z.])/g);
  if (usMatch) {
    const commonWords = new Set([
      'THE', 'AND', 'FOR', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
      'WAS', 'ONE', 'OUR', 'OUT', 'HAS', 'HAD', 'BUT', 'HOW',
      'ARE', 'BUY', 'SELL', 'HOLD', 'WHAT', 'WHEN', 'WHY', 'WHO',
      'THIS', 'THAT', 'WITH', 'FROM', 'THEY', 'BEEN', 'SAID',
      'EACH', 'MAKE', 'LIKE', 'LONG', 'LOOK', 'MANY', 'SOME',
      'THEM', 'THAN', 'BEEN', 'CALL', 'COME', 'MADE', 'FIND',
      'BACK', 'ONLY', 'JUST', 'OVER', 'ALSO', 'KNOW', 'TAKE',
      'INTO', 'YEAR', 'YOUR', 'GOOD', 'GIVE', 'MOST', 'VERY',
      'AFTER', 'WORK', 'FIRST', 'WELL', 'EVEN', 'WANT', 'BECAUSE',
      'THESE', 'COULD', 'STOCK', 'MARKET', 'PRICE', 'TREND',
      'ANALYSIS', 'ABOUT', 'TRADING', 'CHART', 'VOLUME',
      'RSI', 'MACD', 'KDJ', 'BOLL', 'MA', 'EMA',
    ]);
    usMatch.forEach((m) => {
      if (!commonWords.has(m)) {
        codes.add(m);
      }
    });
  }

  return Array.from(codes);
}

/**
 * Fetch quote data for a given ticker symbol.
 */
async function fetchQuote(ticker: string): Promise<FinanceQuoteData | null> {
  try {
    const res = await fetch(
      `${FINANCE_BASE}/v1/quote?ticker=${encodeURIComponent(ticker)}`,
      { headers: FINANCE_HEADERS }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch historical data for a given ticker symbol.
 */
async function fetchHistorical(
  ticker: string,
  range: string = '1mo',
  interval: string = '1d'
): Promise<FinanceHistoricalPoint[]> {
  try {
    const res = await fetch(
      `${FINANCE_BASE}/v1/history?ticker=${encodeURIComponent(ticker)}&range=${range}&interval=${interval}`,
      { headers: FINANCE_HEADERS }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.body || json.results || json || [];
  } catch {
    return [];
  }
}

/**
 * Build a formatted context string from stock data for LLM injection.
 */
export async function buildStockContext(message: string): Promise<string> {
  const codes = extractStockCodes(message);
  if (codes.length === 0) return '';

  const contextParts: string[] = [];

  // Limit to 3 stock codes max to avoid excessive API calls
  const codesToFetch = codes.slice(0, 3);

  for (const code of codesToFetch) {
    const [quote, history] = await Promise.all([
      fetchQuote(code),
      fetchHistorical(code, '1mo', '1d'),
    ]);

    if (quote) {
      const name = quote.shortName || quote.longName || code;
      contextParts.push(
        `### ${name} (${quote.symbol || code})\n` +
        `- 当前价格: ${quote.regularMarketPrice ?? 'N/A'}\n` +
        `- 涨跌额: ${quote.regularMarketChange ?? 'N/A'} (${quote.regularMarketChangePercent ?? 'N/A'}%)\n` +
        `- 成交量: ${quote.regularMarketVolume ?? 'N/A'}\n` +
        `- 市值: ${quote.marketCap ? `${(quote.marketCap / 1e8).toFixed(2)}亿` : 'N/A'}\n` +
        `- 今日最高: ${quote.regularMarketDayHigh ?? 'N/A'}\n` +
        `- 今日最低: ${quote.regularMarketDayLow ?? 'N/A'}\n` +
        `- 今开: ${quote.regularMarketOpen ?? 'N/A'}\n` +
        `- 昨收: ${quote.regularMarketPreviousClose ?? 'N/A'}\n` +
        `- 市盈率(PE): ${quote.trailingPE ?? 'N/A'}\n` +
        `- 50日均线: ${quote.fiftyDayAverage ?? 'N/A'}\n` +
        `- 200日均线: ${quote.twoHundredDayAverage ?? 'N/A'}`
      );
    }

    if (history.length > 0) {
      const recent = history.slice(-10).map(
        (p) => `${p.date}: O=${p.open ?? '-'} H=${p.high ?? '-'} L=${p.low ?? '-'} C=${p.close ?? '-'} V=${p.volume ?? '-'}`
      );
      contextParts.push(`**近期走势** (最近10个交易日):\n${recent.join('\n')}`);
    }
  }

  if (contextParts.length === 0) return '';

  return `\n\n## 实时行情数据\n\n${contextParts.join('\n\n')}\n\n请基于以上实时数据进行分析。`;
}

/**
 * Extract a stock name from a message (e.g., "贵州茅台" from "分析贵州茅台")
 * Returns the detected Chinese stock name or null.
 */
export function extractStockName(message: string): string | null {
  // Common Chinese stock name patterns
  // Try to find 2-4 character Chinese names
  const chineseNames = message.match(/[\u4e00-\u9fff]{2,6}(?=的|股| analyze|分析|看看|怎么样|走势|行情|大盘|技术)/g);
  if (chineseNames && chineseNames.length > 0) {
    return chineseNames[0];
  }

  // Also check for pattern like "分析XXX" at the beginning
  const startMatch = message.match(/^(?:分析|看看|帮我|请|用)[\u4e00-\u9fff]{2,6}/);
  if (startMatch) {
    const name = startMatch[0].replace(/^(分析|看看|帮我|请|用)/, '');
    if (name.length >= 2) return name;
  }

  return null;
}
