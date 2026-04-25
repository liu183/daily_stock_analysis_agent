export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  pe: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

export interface AnalysisReport {
  id: string;
  stockCode: string;
  stockName: string;
  market: string;
  score: number;
  trend: string;
  advice: string;
  summary: string;
  report: string;
  reportJson: ReportJson;
  createdAt: string;
}

export interface ReportJson {
  score: number;
  trend: string;
  operationAdvice: string;
  keyPriceLevels: { support: number[]; resistance: number[] };
  riskAlerts: string[];
  positiveCatalysts: string[];
  newsSentiment: string;
  technicalIndicators: {
    ma5: number;
    ma10: number;
    ma20: number;
    rsi: number;
    macd: string;
  };
  capitalFlow: { mainNetInflow: number; retailNetInflow: number };
}

export interface HistoryItem {
  id: string;
  stockCode: string;
  stockName: string;
  score: number;
  trend: string;
  advice: string;
  createdAt: string;
}

export interface AnalysisTask {
  id: string;
  type: string;
  status: string;
  stockCode: string;
  stockName: string;
  progress: number;
  message: string;
}
