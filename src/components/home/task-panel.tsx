'use client';

import React from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AnalysisTask } from '@/types/stock';

interface TaskPanelProps {
  tasks: AnalysisTask[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case 'failed':
      return <XCircle className="size-4 text-red-500" />;
    case 'running':
      return <Loader2 className="size-4 animate-spin text-primary" />;
    default:
      return <Clock className="size-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
          Completed
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 text-xs">
          Failed
        </Badge>
      );
    case 'running':
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
          Running
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          Pending
        </Badge>
      );
  }
}

function getProgressColor(status: string): string {
  switch (status) {
    case 'completed':
      return '[&>div]:bg-emerald-500';
    case 'failed':
      return '[&>div]:bg-red-500';
    case 'running':
      return '[&>div]:bg-primary';
    default:
      return '';
  }
}

export function TaskPanel({ tasks }: TaskPanelProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Active Tasks</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>

      <ScrollArea className="max-h-48">
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border p-3 bg-muted/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium truncate">
                    {task.stockName
                      ? `${task.stockName} (${task.stockCode})`
                      : task.stockCode || task.type}
                  </span>
                </div>
                {getStatusBadge(task.status)}
              </div>

              {task.message && (
                <p className="text-xs text-muted-foreground pl-6">{task.message}</p>
              )}

              {(task.status === 'running' || task.status === 'pending') && (
                <Progress
                  value={task.progress}
                  className={`h-1.5 ${getProgressColor(task.status)}`}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
