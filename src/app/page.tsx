'use client';

import React, { useEffect, Suspense } from 'react';
import { BarChart3, History, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { StockSearch } from '@/components/home/stock-search';
import { AnalysisReportCard } from '@/components/home/analysis-report';
import { HistoryPanel } from '@/components/home/history-panel';
import { TaskPanel } from '@/components/home/task-panel';
import { ChatView } from '@/components/chat/chat-view';
import { PortfolioView } from '@/components/portfolio/portfolio-view';
import { BacktestView } from '@/components/backtest/backtest-view';
import { SettingsView } from '@/components/settings/settings-view';
import { useAnalysisStore } from '@/stores/analysis-store';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="size-8 animate-spin text-emerald-500" />
    </div>
  );
}

function HomePage() {
  const store = useAnalysisStore();

  useEffect(() => {
    store.loadHistory();
    store.pollTasks();
  }, [store]);

  const handleAnalyze = (code: string, name: string) => {
    store.submitAnalysis(code, name);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Tabs defaultValue="home" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="home" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            <span className="hidden sm:inline">股票分析</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-3.5" />
            <span className="hidden sm:inline">历史报告</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">股票智能分析</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      输入股票代码或名称，AI 将自动生成分析报告
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="size-3.5" />
                    <span>AI 驱动</span>
                  </div>
                </div>
                <StockSearch
                  onAnalyze={handleAnalyze}
                  disabled={store.isAnalyzing}
                />
              </div>

              {store.error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{store.error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {store.activeTasks.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <TaskPanel tasks={store.activeTasks} />
              </CardContent>
            </Card>
          )}

          <AnalysisReportCard
            report={store.currentReport}
            isLoading={store.isAnalyzing}
          />
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="h-full">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">分析历史</h3>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {store.historyItems.length} 条记录
                    </span>
                  </div>
                  <HistoryPanel
                    items={store.historyItems}
                    selectedId={store.selectedHistoryId ?? undefined}
                    onSelect={(id) => store.selectReport(id)}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <AnalysisReportCard
                report={store.currentReport}
                isLoading={false}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'home';

  if (tab === 'chat') {
    return <Suspense fallback={<LoadingFallback />}><ChatView /></Suspense>;
  }

  if (tab === 'portfolio') {
    return <Suspense fallback={<LoadingFallback />}><PortfolioView /></Suspense>;
  }

  if (tab === 'backtest') {
    return <Suspense fallback={<LoadingFallback />}><BacktestView /></Suspense>;
  }

  if (tab === 'settings') {
    return <Suspense fallback={<LoadingFallback />}><SettingsView /></Suspense>;
  }

  return <HomePage />;
}

export default function AppPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AppContent />
    </Suspense>
  );
}
