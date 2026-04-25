'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sparkles,
  BarChart3,
  ChevronDown,
  Activity,
  DollarSign,
  Zap,
  Shield,
  Newspaper,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { AnalysisReport } from '@/types/stock';

interface AnalysisReportCardProps {
  report: AnalysisReport | null;
  isLoading: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  if (score >= 40) return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong Buy';
  if (score >= 70) return 'Buy';
  if (score >= 55) return 'Moderate Buy';
  if (score >= 40) return 'Hold';
  if (score >= 25) return 'Moderate Sell';
  return 'Sell';
}

function getAdviceBadge(trend: string, advice: string) {
  const t = trend.toLowerCase();
  const a = advice.toLowerCase();

  if (t === 'bullish' || a === 'buy') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
        <TrendingUp className="size-3 mr-1" />
        {t === 'bullish' ? 'Bullish' : 'Buy'}
      </Badge>
    );
  }
  if (t === 'bearish' || a === 'sell') {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">
        <TrendingDown className="size-3 mr-1" />
        {t === 'bearish' ? 'Bearish' : 'Sell'}
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
      <Minus className="size-3 mr-1" />
      {t === 'neutral' ? 'Neutral' : 'Hold'}
    </Badge>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/30"
        />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'}
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// Mini sparkline data generator for demo
function generateSparkData() {
  const data = [];
  let value = 150 + Math.random() * 50;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.45) * 5;
    data.push({ day: i, value: Math.round(value * 100) / 100 });
  }
  return data;
}

function LoadingSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export function AnalysisReportCard({ report, isLoading }: AnalysisReportCardProps) {
  const [risksOpen, setRisksOpen] = useState(true);
  const [catalystsOpen, setCatalystsOpen] = useState(true);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!report) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="size-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Analysis Yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Search for a stock above and click &quot;Analyze&quot; to generate a comprehensive AI-powered analysis report.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rj = report.reportJson;
  const sparkData = generateSparkData();

  return (
    <div className="space-y-4">
      {/* Main Report Card */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Score Gauge */}
            <ScoreGauge score={report.score} />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CardTitle className="text-xl truncate">
                  {report.stockName}
                </CardTitle>
                <Badge variant="outline" className="font-mono">
                  {report.stockCode}
                </Badge>
                {getAdviceBadge(report.trend, report.advice)}
              </div>
              <CardDescription className="mt-1">
                {getScoreLabel(report.score)} ·{' '}
                {report.trend.charAt(0).toUpperCase() + report.trend.slice(1)} trend
              </CardDescription>

              {report.summary && (
                <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                  {report.summary}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <MetricCard
              icon={<Activity className="size-4" />}
              label="RSI"
              value={rj.technicalIndicators.rsi.toString()}
              sublabel={rj.technicalIndicators.rsi > 70 ? 'Overbought' : rj.technicalIndicators.rsi < 30 ? 'Oversold' : 'Normal'}
            />
            <MetricCard
              icon={<DollarSign className="size-4" />}
              label="MACD"
              value={rj.technicalIndicators.macd.charAt(0).toUpperCase() + rj.technicalIndicators.macd.slice(1)}
              sublabel="Signal"
            />
            <MetricCard
              icon={<Zap className="size-4" />}
              label="Main Flow"
              value={`$${(rj.capitalFlow.mainNetInflow / 1e6).toFixed(1)}M`}
              sublabel={rj.capitalFlow.mainNetInflow >= 0 ? 'Net Inflow' : 'Net Outflow'}
              positive={rj.capitalFlow.mainNetInflow >= 0}
            />
            <MetricCard
              icon={<Shield className="size-4" />}
              label="Retail Flow"
              value={`$${(rj.capitalFlow.retailNetInflow / 1e6).toFixed(1)}M`}
              sublabel={rj.capitalFlow.retailNetInflow >= 0 ? 'Net Inflow' : 'Net Outflow'}
              positive={rj.capitalFlow.retailNetInflow >= 0}
            />
          </div>

          {/* Sparkline Chart */}
          <div className="mb-4">
            <ChartContainer
              config={{ value: { label: 'Price', color: 'hsl(var(--primary))' } }}
              className="h-[120px] w-full"
            >
              <LineChart data={sparkData}>
                <XAxis dataKey="day" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Simulated trend visualization
            </p>
          </div>

          {/* Technical Indicators */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <BarChart3 className="size-4" />
              Moving Averages
            </h4>
            <div className="flex gap-3">
              <Badge variant="secondary" className="text-xs">
                MA5: ${rj.technicalIndicators.ma5.toFixed(2)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                MA10: ${rj.technicalIndicators.ma10.toFixed(2)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                MA20: ${rj.technicalIndicators.ma20.toFixed(2)}
              </Badge>
            </div>
          </div>

          {/* Key Price Levels */}
          {(rj.keyPriceLevels.support.length > 0 || rj.keyPriceLevels.resistance.length > 0) && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <DollarSign className="size-4" />
                Key Price Levels
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {rj.keyPriceLevels.support.length > 0 && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Support</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {rj.keyPriceLevels.support.map((v, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700">
                          ${v.toFixed(2)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {rj.keyPriceLevels.resistance.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 p-3">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Resistance</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {rj.keyPriceLevels.resistance.map((v, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-red-300 dark:border-red-700">
                          ${v.toFixed(2)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Risk Alerts */}
          <Collapsible open={risksOpen} onOpenChange={setRisksOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-semibold hover:text-foreground/80 transition-colors py-1">
              <AlertTriangle className="size-4 text-amber-500" />
              Risk Alerts ({rj.riskAlerts.length})
              <ChevronDown
                className={`size-4 ml-auto transition-transform ${risksOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {rj.riskAlerts.length > 0 ? (
                <ul className="space-y-2 ml-6">
                  {rj.riskAlerts.map((risk, i) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground ml-6">No significant risks identified.</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Positive Catalysts */}
          <Collapsible open={catalystsOpen} onOpenChange={setCatalystsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-semibold hover:text-foreground/80 transition-colors py-1">
              <Sparkles className="size-4 text-emerald-500" />
              Positive Catalysts ({rj.positiveCatalysts.length})
              <ChevronDown
                className={`size-4 ml-auto transition-transform ${catalystsOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              {rj.positiveCatalysts.length > 0 ? (
                <ul className="space-y-2 ml-6">
                  {rj.positiveCatalysts.map((cat, i) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                      {cat}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground ml-6">No positive catalysts identified.</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* News Sentiment */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Newspaper className="size-4" />
              News Sentiment
            </h4>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {rj.newsSentiment || 'No news sentiment data available.'}
            </p>
          </div>

          {/* Detailed Report */}
          {report.report && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <BarChart3 className="size-4" />
                  Detailed Report
                </h4>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: report.report
                      .replace(/^### (.*$)/gm, '<h3 class="text-sm font-semibold mt-4 mb-1">$1</h3>')
                      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mt-4 mb-2">$1</h2>')
                      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />'),
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 bg-muted/30">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className={`text-sm font-semibold ${
          positive === undefined
            ? ''
            : positive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
        }`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}
