'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, ShieldAlert, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PerformanceMetrics } from '@/types/backtest';

interface PerformanceCardProps {
  metrics: PerformanceMetrics | null;
  loading?: boolean;
}

function MetricItem({
  label,
  value,
  suffix = '%',
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number | undefined | null;
  suffix?: string;
  icon: React.ElementType;
  colorClass?: string;
}) {
  const display = value !== null && value !== undefined ? `${value}${suffix}` : '--';

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-b-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${colorClass || ''}`}>
        {display}
      </span>
    </div>
  );
}

export function PerformanceCard({ metrics, loading }: PerformanceCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Overall Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Overall Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground text-center py-8">
            No backtest data yet. Run a backtest to see performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Overall Performance</CardTitle>
        <p className="text-xs text-muted-foreground">
          {metrics.completedCount} completed / {metrics.totalEvaluations} total
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div>
          <MetricItem
            label="Direction Accuracy"
            value={metrics.directionAccuracyPct}
            icon={Target}
            colorClass={metrics.directionAccuracyPct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
          />
          <MetricItem
            label="Win Rate"
            value={metrics.winRatePct}
            icon={Trophy}
            colorClass={metrics.winRatePct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          />
          <MetricItem
            label="Avg Sim Return"
            value={metrics.avgSimulatedReturnPct}
            icon={metrics.avgSimulatedReturnPct >= 0 ? TrendingUp : TrendingDown}
            colorClass={metrics.avgSimulatedReturnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          />
          <MetricItem
            label="Avg Stock Return"
            value={metrics.avgStockReturnPct}
            icon={metrics.avgStockReturnPct >= 0 ? TrendingUp : TrendingDown}
            colorClass={metrics.avgStockReturnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
          />
          <MetricItem
            label="Stop Loss Rate"
            value={metrics.stopLossTriggerRate}
            icon={ShieldAlert}
            colorClass="text-red-600 dark:text-red-400"
          />
          <MetricItem
            label="Take Profit Rate"
            value={metrics.takeProfitTriggerRate}
            icon={Trophy}
            colorClass="text-emerald-600 dark:text-emerald-400"
          />
        </div>

        {/* Win/Loss/Neutral counts */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.winCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="size-3" />
              Win
            </div>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2.5 text-center">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {metrics.lossCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <TrendingDown className="size-3" />
              Loss
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {metrics.neutralCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Minus className="size-3" />
              Neutral
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StockPerformanceCardProps {
  stockCode: string;
  stockName: string;
  directionAccuracyPct: number;
  winRatePct: number;
  avgReturnPct: number;
  total: number;
  winCount: number;
  lossCount: number;
  neutralCount: number;
}

export function StockPerformanceCard({
  stockCode,
  stockName,
  directionAccuracyPct,
  winRatePct,
  avgReturnPct,
  total,
  winCount,
  lossCount,
  neutralCount,
}: StockPerformanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          {stockName || stockCode}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{stockCode} · {total} evaluations</p>
      </CardHeader>
      <CardContent className="pt-0">
        <MetricItem
          label="Dir Accuracy"
          value={directionAccuracyPct}
          icon={Target}
          colorClass={directionAccuracyPct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
        />
        <MetricItem
          label="Win Rate"
          value={winRatePct}
          icon={Trophy}
          colorClass={winRatePct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
        <MetricItem
          label="Avg Return"
          value={avgReturnPct}
          icon={avgReturnPct >= 0 ? TrendingUp : TrendingDown}
          colorClass={avgReturnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
        />
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{winCount}W</span>
          <span className="text-xs font-medium text-red-600 dark:text-red-400">{lossCount}L</span>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{neutralCount}N</span>
        </div>
      </CardContent>
    </Card>
  );
}
