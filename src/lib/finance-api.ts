const FINANCE_API_BASE = "https://internal-api.z.ai/external/finance";

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "X-Z-AI-From": "Z",
};

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${FINANCE_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Finance API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// Search stocks by query string
export async function searchStocks(query: string) {
  return request(`/v1/finance/search?q=${encodeURIComponent(query)}`);
}

// Get real-time quote for a given ticker
export async function getStockQuote(ticker: string) {
  return request(`/v1/finance/quote?symbol=${encodeURIComponent(ticker)}`);
}

// Get historical price data for a stock
export async function getStockHistory(
  symbol: string,
  interval: string = "1d",
  range?: string
) {
  const params = new URLSearchParams({
    symbol,
    interval,
  });
  if (range) {
    params.set("range", range);
  }
  return request(`/v1/finance/history?${params.toString()}`);
}

// Get stock-related news, optionally filtered by ticker
export async function getStockNews(ticker?: string) {
  const params = ticker ? `?symbol=${encodeURIComponent(ticker)}` : "";
  return request(`/v1/finance/news${params}`);
}

// Get stock module data (financial-data, statistics, default-key-statistics, etc.)
export async function getStockModules(
  ticker: string,
  module: string
) {
  const params = new URLSearchParams({
    symbol: ticker,
    module,
  });
  return request(`/v1/finance/modules?${params.toString()}`);
}
