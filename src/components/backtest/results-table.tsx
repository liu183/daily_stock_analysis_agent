'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BacktestResultItem } from '@/types/backtest';

interface ResultsTableProps {
  items: BacktestResultItem[];
  loading?: boolean;
}

function OutcomeBadge({ outcome }: { outcome?: string | null }) {
  if (!outcome) {
    return <Badge variant="secondary" className="text-xs">--</Badge>;
  }

  const config: Record<string, { label: string; className: string }> = {
    win: {
      label: 'WIN',
      className:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border-0',
    },
    loss: {
      label: 'LOSS',
      className:
        'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 border-0',
    },
    neutral: {
      label: 'NEUTRAL',
      className:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-0',
    },
  };

  const c = config[outcome] || {
    label: outcome.toUpperCase(),
    className: 'bg-muted text-muted-foreground border-0',
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${c.className}`}>
      {c.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    completed: {
      label: 'Done',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-0',
    },
    insufficient: {
      label: 'Insufficient',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-0',
    },
    pending: {
      label: 'Pending',
      className: 'bg-muted text-muted-foreground border-0',
    },
    error: {
      label: 'Error',
      className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-0',
    },
  };

  const c = config[status] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-0',
  };

  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.label}
    </Badge>
  );
}

function DirectionBadge({ correct }: { correct?: boolean | null }) {
  if (correct === null || correct === undefined) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }
  return correct ? (
    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Yes</span>
  ) : (
    <span className="text-xs text-red-600 dark:text-red-400 font-medium">✗ No</span>
  );
}

function formatReturn(pct?: number | null) {
  if (pct === null || pct === undefined) return '--';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function formatTrend(trend?: string | null) {
  if (!trend) return '--';
  const map: Record<string, { label: string; className: string }> = {
    bullish: {
      label: '🟢 Bullish',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    bearish: {
      label: '🔴 Bearish',
      className: 'text-red-600 dark:text-red-400',
    },
    neutral: {
      label: '🟡 Neutral',
      className: 'text-amber-600 dark:text-amber-400',
    },
  };
  const c = map[trend] || { label: trend, className: '' };
  return <span className={`text-xs font-medium ${c.className}`}>{c.label}</span>;
}

export function ResultsTable({ items, loading }: ResultsTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border">
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No backtest results yet. Run a backtest to see results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="max-h-[480px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold whitespace-nowrap">Stock</TableHead>
              <TableHead className="text-xs font-semibold whitespace-nowrap">Date</TableHead>
              <TableHead className="text-xs font-semibold whitespace-nowrap">Prediction</TableHead>
              <TableHead className="text-xs font-semibold whitespace-nowrap text-right">Return</TableHead>
              <TableHead className="text-xs font-semibold whitespace-nowrap text-center">Direction</TableHead>
              <TableHead className="text-xs font-semibold whitespace-nowrap text-center">Outcome</TableHead>
              <TableHead className="text-xs font-semibold whitespace-nowrap text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-2.5">
                  <div className="text-sm font-medium">{item.stockCode}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {item.stockName || '--'}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground py-2.5 whitespace-nowrap">
                  {item.analysisDate
                    ? new Date(item.analysisDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '--'}
                </TableCell>
                <TableCell className="py-2.5">
                  {formatTrend(item.trendPrediction)}
                </TableCell>
                <TableCell
                  className={`text-xs font-semibold text-right tabular-nums py-2.5 whitespace-nowrap ${
                    (item.actualReturnPct ?? 0) >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatReturn(item.actualReturnPct)}
                </TableCell>
                <TableCell className="text-center py-2.5">
                  <DirectionBadge correct={item.directionCorrect} />
                </TableCell>
                <TableCell className="text-center py-2.5">
                  <OutcomeBadge outcome={item.outcome} />
                </TableCell>
                <TableCell className="text-center py-2.5">
                  <StatusBadge status={item.evalStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
