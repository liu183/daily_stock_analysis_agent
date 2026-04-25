'use client';

import React from 'react';
import { Clock, TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistoryItem } from '@/types/stock';

interface HistoryPanelProps {
  items: HistoryItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

function getTrendIcon(trend: string) {
  const t = trend.toLowerCase();
  if (t === 'bullish') return <TrendingUp className="size-3.5 text-emerald-500" />;
  if (t === 'bearish') return <TrendingDown className="size-3.5 text-red-500" />;
  return <Minus className="size-3.5 text-amber-500" />;
}

function getScoreBadge(score: number) {
  if (score >= 70) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
        {score}
      </Badge>
    );
  }
  if (score >= 40) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 text-xs">
        {score}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 text-xs">
      {score}
    </Badge>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function HistoryPanel({ items, selectedId, onSelect, isLoading }: HistoryPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Clock className="size-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No History</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Analyzed stocks will appear here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
      <div className="space-y-1 p-1">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-accent/50 ${
                isSelected ? 'bg-accent border border-accent-foreground/10' : ''
              }`}
            >
              {/* Trend Icon */}
              <div
                className={`shrink-0 flex items-center justify-center size-8 rounded-full ${
                  isSelected ? 'bg-background' : 'bg-muted'
                }`}
              >
                {getTrendIcon(item.trend)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">
                    {item.stockName || item.stockCode}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {item.stockCode}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(item.createdAt)}
                </p>
              </div>

              {/* Score Badge */}
              <div className="shrink-0">
                {getScoreBadge(item.score)}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
