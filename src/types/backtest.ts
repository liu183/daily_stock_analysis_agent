export interface BacktestResultItem {
  id: string;
  stockCode: string;
  stockName?: string;
  analysisDate?: string;
  trendPrediction?: string;
  operationAdvice?: string;
  directionExpected?: string;
  actualReturnPct?: number;
  actualMovement?: string;
  directionCorrect?: boolean;
  outcome?: string;
  evalStatus: string;
  evalWindowDays: number;
}

export interface PerformanceMetrics {
  directionAccuracyPct: number;
  winRatePct: number;
  avgSimulatedReturnPct: number;
  avgStockReturnPct: number;
  stopLossTriggerRate: number;
  takeProfitTriggerRate: number;
  avgDaysToFirstHit?: number;
  completedCount: number;
  totalEvaluations: number;
  winCount: number;
  lossCount: number;
  neutralCount: number;
  evalWindowDays: number;
}

export interface BacktestRunResponse {
  processed: number;
  saved: number;
  completed: number;
  insufficient: number;
  errors: number;
}
