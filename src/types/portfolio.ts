export interface PortfolioAccount {
  id: string;
  name: string;
  broker: string | null;
  market: string;
  baseCurrency: string;
  createdAt: string;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avgCost: number;
  lastPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  accountId: string;
  accountName: string;
  valuationCurrency: string;
}

export interface PortfolioTrade {
  id: string;
  accountId: string;
  accountName: string;
  symbol: string;
  tradeDate: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  note: string | null;
}

export interface PortfolioCashEntry {
  id: string;
  accountId: string;
  accountName: string;
  eventDate: string;
  direction: 'in' | 'out';
  amount: number;
  currency: string | null;
  note: string | null;
}

export interface PortfolioSnapshot {
  totalEquity: number;
  totalMarketValue: number;
  totalCash: number;
  currency: string;
  accountCount: number;
  positions: PortfolioPosition[];
}

export interface PortfolioRisk {
  concentration: {
    topPositions: { symbol: string; weightPct: number }[];
    topWeightPct: number;
  };
  drawdown: {
    maxDrawdownPct: number;
    currentDrawdownPct: number;
    alert: boolean;
  };
}

export interface CreateAccountInput {
  name: string;
  broker?: string;
  market: string;
  baseCurrency: string;
}

export interface CreateTradeInput {
  accountId: string;
  symbol: string;
  tradeDate: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee?: number;
  tax?: number;
  note?: string;
}

export interface CreateCashInput {
  accountId: string;
  eventDate: string;
  direction: 'in' | 'out';
  amount: number;
  currency?: string;
  note?: string;
}
