'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  Wrench,
  Sparkles,
  User,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ChatMessage, ThinkingStep } from '@/stores/chat-store';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return <UserBubble message={message} />;
  }
  return <AssistantBubble message={message} />;
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end gap-3 max-w-[85%] ml-auto">
      <div className="rounded-2xl rounded-tr-md bg-emerald-600 text-white px-4 py-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.skillName && (
          <p className="text-[11px] text-emerald-200 mt-1.5">
            📊 {message.skillName}
          </p>
        )}
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
        <User className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const hasThinking = message.thinkingSteps && message.thinkingSteps.length > 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex gap-3 max-w-[90%] group">
      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mt-0.5">
        <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Skill badge */}
        {message.skillName && (
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-normal"
          >
            📊 {message.skillName}
          </Badge>
        )}

        {/* Thinking steps */}
        {hasThinking && (
          <Collapsible open={showThinking} onOpenChange={setShowThinking}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/70 transition-colors">
                {showThinking ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
                思考过程
                {showThinking && (
                  <span className="text-[11px]">({message.thinkingSteps!.length}步)</span>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1.5">
              <ThinkingStepsList steps={message.thinkingSteps!} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Message content */}
        <div className="relative">
          <div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3">
            <div className="markdown-content text-sm leading-relaxed prose-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold mt-3 mb-2 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold mt-3 mb-1.5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-1 first:mt-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-1.5 space-y-0.5 list-disc pl-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-1.5 space-y-0.5 list-decimal pl-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  table: ({ children }) => (
                    <div className="my-2 overflow-x-auto rounded-md border">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-2 py-1.5 bg-muted font-semibold text-left border-b">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-2 py-1.5 border-b last:border-b-0">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-1.5 pl-3 border-l-2 border-emerald-300 dark:border-emerald-700 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code
                          className="px-1 py-0.5 rounded bg-muted text-xs font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={cn('text-xs font-mono', className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="my-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      {children}
                    </pre>
                  ),
                  hr: () => (
                    <hr className="my-3 border-border" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Copy button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 size-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-card border shadow-sm"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ThinkingStepsList({ steps }: { steps: ThinkingStep[] }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1.5">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
          <StepIcon type={step.type} />
          <span className="flex-1">{step.message || step.display_name || step.tool}</span>
          {step.duration !== undefined && step.duration > 0 && (
            <span className="text-[11px] tabular-nums">{step.duration}ms</span>
          )}
          {step.success === false && (
            <span className="text-[11px] text-red-500">失败</span>
          )}
        </div>
      ))}
    </div>
  );
}

function StepIcon({ type }: { type: ThinkingStep['type'] }) {
  switch (type) {
    case 'thinking':
      return <Brain className="size-3.5 text-amber-500 shrink-0" />;
    case 'tool_start':
    case 'tool_done':
      return <Wrench className="size-3.5 text-blue-500 shrink-0" />;
    case 'generating':
      return <Sparkles className="size-3.5 text-emerald-500 shrink-0" />;
    default:
      return <div className="size-3.5 shrink-0" />;
  }
}
