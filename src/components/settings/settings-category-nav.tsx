'use client';

import React from 'react';
import {
  Settings,
  Brain,
  Database,
  Bell,
  LineChart,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfigCategory } from '@/types/settings';
import { CONFIG_CATEGORY_LABELS } from '@/types/settings';

interface SettingsCategoryNavProps {
  activeCategory: ConfigCategory;
  onSelect: (category: ConfigCategory) => void;
  issueCounts?: Record<string, number>;
}

const CATEGORY_ICONS: Record<ConfigCategory, React.ElementType> = {
  base: Settings,
  ai_model: Brain,
  data_source: Database,
  notification: Bell,
  analysis: LineChart,
  system: Server,
};

const categories: ConfigCategory[] = [
  'base',
  'ai_model',
  'data_source',
  'notification',
  'analysis',
  'system',
];

export function SettingsCategoryNav({
  activeCategory,
  onSelect,
  issueCounts = {},
}: SettingsCategoryNavProps) {
  return (
    <nav className="space-y-1">
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat];
        const isActive = activeCategory === cat;
        const issueCount = issueCounts[cat] || 0;

        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{CONFIG_CATEGORY_LABELS[cat]}</span>
            {issueCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                {issueCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
