'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Download,
  Loader2,
  Sparkles,
  MessageSquare,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SessionList } from '@/components/chat/session-list';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';

const QUICK_QUESTIONS = [
  { text: '分析贵州茅台', icon: '🍶' },
  { text: '用缠论分析比亚迪', icon: '🚗' },
  { text: '波浪理论看宁德时代', icon: '🔋' },
];

export function ChatView() {
  const store = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    store.loadSessions();
  }, [store]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.messages, store.progressSteps]);

  const handleSend = useCallback(
    (message: string, skill?: string) => {
      store.sendMessage(message, skill);
    },
    [store]
  );

  const handleExport = useCallback(async () => {
    if (!store.currentSessionId) return;
    try {
      const res = await fetch(`/api/chat/${store.currentSessionId}/export`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    }
  }, [store.currentSessionId]);

  const hasMessages = store.messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-1px)]">
      {/* Left Panel - Session List */}
      <div className="hidden md:flex w-64 lg:w-72 flex-col border-r bg-muted/20 shrink-0">
        <div className="px-4 py-3 flex items-center gap-2">
          <MessageSquare className="size-4 text-emerald-600" />
          <h2 className="text-sm font-semibold">对话历史</h2>
          {store.currentSessionId && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-7"
              onClick={handleExport}
              title="导出对话"
            >
              <Download className="size-3.5" />
            </Button>
          )}
        </div>
        <Separator />
        <SessionList
          sessions={store.sessions}
          currentSessionId={store.currentSessionId}
          onSelect={store.switchSession}
          onNew={store.startNewChat}
          onDelete={store.deleteSession}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-4 py-3 flex items-center gap-2 border-b bg-background">
          {/* Mobile: show session list toggle */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="size-4 text-emerald-600 shrink-0" />
            <h1 className="text-sm font-semibold">AI 问股助手</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              — 基于实时行情的智能分析
            </span>
          </div>
          {store.currentSessionId && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs md:hidden"
                onClick={handleExport}
              >
                <Download className="size-3.5 mr-1" />
                导出
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs hidden md:inline-flex"
                onClick={handleExport}
              >
                <Download className="size-3.5 mr-1" />
                导出对话
              </Button>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
              {hasMessages ? (
                <>
                  {store.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}

                  {/* Loading indicator */}
                  {store.isLoading && (
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                        <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                      </div>
                      <div className="flex-1 space-y-2">
                        {/* Progress steps */}
                        {store.progressSteps.length > 0 && (
                          <div className="rounded-xl border bg-card px-4 py-3 space-y-2">
                            {store.progressSteps.map((step, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <Loader2
                                  className={cn(
                                    'size-3.5 animate-spin',
                                    i === store.progressSteps.length - 1
                                      ? 'text-emerald-500'
                                      : 'text-muted-foreground/50'
                                  )}
                                />
                                <span>{step.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {store.chatError && (
                    <div className="flex justify-center">
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 max-w-md text-center">
                        {store.chatError}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Empty State */
                <EmptyState onQuestionClick={handleSend} />
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          isLoading={store.isLoading}
        />
      </div>
    </div>
  );
}

function EmptyState({
  onQuestionClick,
}: {
  onQuestionClick: (message: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-4">
        <TrendingUp className="size-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-lg font-semibold mb-1.5">AI 问股助手</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        输入股票代码或名称，获取基于实时行情数据的AI智能分析。支持多种分析策略，包括缠论、波浪理论等。
      </p>

      {/* Quick Questions */}
      <div className="w-full max-w-md space-y-3">
        <p className="text-xs text-muted-foreground text-center font-medium">
          试试这些问题 ↓
        </p>
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.text}
            onClick={() => onQuestionClick(q.text)}
            className="w-full flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-left hover:bg-accent/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors group"
          >
            <span className="text-lg">{q.icon}</span>
            <span className="text-foreground/80 group-hover:text-foreground transition-colors">
              {q.text}
            </span>
            <BarChart3 className="size-3.5 text-muted-foreground/40 ml-auto group-hover:text-emerald-500 transition-colors" />
          </button>
        ))}
      </div>

      {/* Strategy pills */}
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-sm">
        {['缠论', '波浪理论', '均线金叉', '情绪周期', '底部放量'].map(
          (s) => (
            <span
              key={s}
              className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
            >
              {s}
            </span>
          )
        )}
      </div>
    </div>
  );
}
