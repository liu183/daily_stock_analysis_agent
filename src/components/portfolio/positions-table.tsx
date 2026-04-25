'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PortfolioPosition } from '@/types/portfolio';

interface PositionsTableProps {
  positions: PortfolioPosition[];
  currency: string;
  onDeleteTrade?: (accountId: string, symbol: string) => void;
}

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    HKD: 'HK$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPnl(value: number, pct: number): React.ReactNode {
  const isPositive = value > 0;
  const isZero = value === 0;
  const colorClass = isZero
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex flex-col items-end">
      <span className={`font-medium ${colorClass}`}>
        {isPositive ? '+' : ''}{value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className={`text-xs ${colorClass}`}>
        {isPositive ? <ArrowUp className="inline size-3" /> : isZero ? '' : <ArrowDown className="inline size-3" />}
        {isPositive ? '+' : ''}{pct.toFixed(2)}%
      </span>
    </div>
  );
}

export function PositionsTable({ positions, currency }: PositionsTableProps) {
  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">暂无持仓数据</p>
        <p className="text-xs mt-1">添加交易记录后将自动计算持仓</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">账户</TableHead>
            <TableHead className="text-xs font-semibold">代码</TableHead>
            <TableHead className="text-xs font-semibold text-right">数量</TableHead>
            <TableHead className="text-xs font-semibold text-right">均价</TableHead>
            <TableHead className="text-xs font-semibold text-right">现价</TableHead>
            <TableHead className="text-xs font-semibold text-right">市值</TableHead>
            <TableHead className="text-xs font-semibold text-right">盈亏</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((pos) => (
            <TableRow key={`${pos.accountId}-${pos.symbol}`} className="hover:bg-muted/30">
              <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">
                {pos.accountName}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono text-xs">
                  {pos.symbol}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {pos.quantity.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-muted-foreground">
                {formatCurrency(pos.avgCost, pos.valuationCurrency)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatCurrency(pos.lastPrice, pos.valuationCurrency)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatCurrency(pos.marketValue, pos.valuationCurrency)}
              </TableCell>
              <TableCell className="text-right">
                {formatPnl(pos.unrealizedPnl, pos.unrealizedPnlPct)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
