'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PortfolioPosition } from '@/types/portfolio';

interface HoldingsPieChartProps {
  positions: PortfolioPosition[];
  currency: string;
}

const COLORS = [
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
];

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    HKD: 'HK$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CustomTooltip = ({ active, payload, currency }: { active?: boolean; payload?: { name: string; value: number; payload?: { percent?: number } }[]; currency: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-semibold font-mono">{data.name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          市值: {formatCurrency(data.value, currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          占比: {((data.payload.percent ?? 0) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: { payload?: { color: string; value: string }[] }) => {
  if (!payload || payload.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground font-mono">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function HoldingsPieChart({ positions, currency }: HoldingsPieChartProps) {
  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        暂无持仓分布数据
      </div>
    );
  }

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);

  // Merge small positions into "其他"
  const THRESHOLD = 0.03; // 3%
  let chartData = positions.map((p) => ({
    name: p.symbol,
    value: p.marketValue,
    percent: totalMarketValue > 0 ? p.marketValue / totalMarketValue : 0,
  }));

  const otherItems = chartData.filter((d) => d.percent < THRESHOLD);
  const mainItems = chartData.filter((d) => d.percent >= THRESHOLD);

  if (otherItems.length > 0) {
    const otherTotal = otherItems.reduce((sum, d) => sum + d.value, 0);
    mainItems.push({
      name: '其他',
      value: otherTotal,
      percent: totalMarketValue > 0 ? otherTotal / totalMarketValue : 0,
    });
  }

  chartData = mainItems.sort((a, b) => b.value - a.value);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={45}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            strokeWidth={0}
          >
            {chartData.map((_entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
