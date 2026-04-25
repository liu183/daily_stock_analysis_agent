'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Play,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { PerformanceCard, StockPerformanceCard } from './performance-card';
import { ResultsTable } from './results-table';
import type { BacktestResultItem, PerformanceMetrics, BacktestRunResponse } from '@/types/backtest';

interface PerStockPerformance {
  stockCode: string;
  stockName: string;
  total: number;
  directionAccuracyPct: number;
  winRatePct: number;
  avgReturnPct: number;
  winCount: number;
  lossCount: number;
  neutralCount: number;
}

export function BacktestView() {
  // Filters
  const [stockCode, setStockCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [evalWindowDays, setEvalWindowDays] = useState('10');
  const [forceRerun, setForceRerun] = useState(false);

  // Data
  const [results, setResults] = useState<BacktestResultItem[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [perStock, setPerStock] = useState<PerStockPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<BacktestRunResponse | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (stockCode) params.set('stockCode', stockCode);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/backtest?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  }, [page, stockCode, startDate, endDate]);

  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch('/api/backtest/performance');
      if (res.ok) {
        const data = await res.json();
        if (data.overall) {
          setMetrics(data.overall);
        }
        setPerStock(data.perStock || []);
      }
    } catch (err) {
      console.error('Failed to fetch performance:', err);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forceRerun,
          evalWindowDays: parseInt(evalWindowDays, 10),
          stockCode: stockCode || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      if (res.ok) {
        const data: BacktestRunResponse = await res.json();
        setRunResult(data);
        // Refresh data
        await Promise.all([fetchResults(), fetchPerformance()]);
      }
    } catch (err) {
      console.error('Failed to run backtest:', err);
    } finally {
      setRunning(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchResults();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">策略回测</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Backtest AI predictions against actual stock price movements
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bt-stock" className="text-xs">Stock Code</Label>
              <Input
                id="bt-stock"
                placeholder="e.g. 600519"
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                className="w-36 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt-start" className="text-xs">Start Date</Label>
              <Input
                id="bt-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt-end" className="text-xs">End Date</Label>
              <Input
                id="bt-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bt-window" className="text-xs">Eval Window (days)</Label>
              <Input
                id="bt-window"
                type="number"
                min={1}
                max={60}
                value={evalWindowDays}
                onChange={(e) => setEvalWindowDays(e.target.value)}
                className="w-28 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Switch
                id="bt-force"
                checked={forceRerun}
                onCheckedChange={setForceRerun}
              />
              <Label htmlFor="bt-force" className="text-xs cursor-pointer">Force Rerun</Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleFilter} className="h-9 gap-1.5">
              <Filter className="size-3.5" />
              Filter
            </Button>
            <Button
              size="sm"
              onClick={handleRun}
              disabled={running}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {running ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              {running ? 'Running...' : 'Run Backtest'}
            </Button>
          </div>

          {/* Run result banner */}
          {runResult && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
              <RefreshCw className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Processed <strong>{runResult.processed}</strong> analyses:
                {' '}<strong>{runResult.completed}</strong> completed,
                {' '}<strong>{runResult.insufficient}</strong> insufficient data,
                {' '}<strong>{runResult.errors}</strong> errors.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar: Performance */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <PerformanceCard metrics={metrics} loading={loading} />

          {/* Per-stock performance */}
          {perStock.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Per-Stock Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                  {perStock.map((stock) => (
                    <StockPerformanceCard key={stock.stockCode} {...stock} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main area: Results table */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Backtest Results
                </CardTitle>
                {!loading && results.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {results.length} of {totalPages * pageSize} shown
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResultsTable items={results} loading={loading} />

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 gap-1"
                    >
                      <ChevronLeft className="size-3.5" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 gap-1"
                    >
                      Next
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
