'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STRATEGIES = [
  { value: '通用分析', label: '通用分析' },
  { value: '均线金叉', label: '均线金叉' },
  { value: '缠论', label: '缠论' },
  { value: '波浪理论', label: '波浪理论' },
  { value: '多头趋势', label: '多头趋势' },
  { value: '箱体震荡', label: '箱体震荡' },
  { value: '情绪周期', label: '情绪周期' },
  { value: '底部放量', label: '底部放量' },
  { value: '缩量回调', label: '缩量回调' },
];

interface ChatInputProps {
  onSend: (message: string, skill?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = React.useState('');
  const [skill, setSkill] = React.useState('通用分析');
  const [showStrategies, setShowStrategies] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed, skill);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, disabled, onSend, skill]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t bg-background">
      {/* Strategy Selector */}
      <div className="px-4 pt-3">
        <button
          onClick={() => setShowStrategies(!showStrategies)}
          className={cn(
            'text-xs px-2.5 py-1 rounded-full border transition-colors',
            showStrategies
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/80'
          )}
        >
          📊 {skill}
        </button>

        {showStrategies && (
          <RadioGroup
            value={skill}
            onValueChange={(v) => {
              setSkill(v);
              setShowStrategies(false);
            }}
            className="flex flex-wrap gap-2 mt-2"
          >
            {STRATEGIES.map((s) => (
              <Tooltip key={s.value}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem
                      value={s.value}
                      id={`strategy-${s.value}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`strategy-${s.value}`}
                      className={cn(
                        'cursor-pointer text-xs px-3 py-1.5 rounded-full border transition-colors select-none',
                        skill === s.value
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 font-medium'
                          : 'border-muted hover:bg-muted/50 text-muted-foreground'
                      )}
                    >
                      {s.label}
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{s.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </RadioGroup>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 pt-2">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入股票代码或问题，如：分析贵州茅台、600519 走势如何..."
              disabled={isLoading || disabled}
              className="min-h-[44px] max-h-[160px] resize-none pr-12 rounded-xl border-muted-foreground/20 focus-visible:ring-emerald-500/30"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || disabled}
            size="icon"
            className="size-10 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
          Enter 发送 · Shift+Enter 换行 · AI分析仅供参考，不构成投资建议
        </p>
      </div>
    </div>
  );
}
