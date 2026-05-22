'use client';

import React, { useState, useCallback } from 'react';
import {
  Eye, EyeOff, Zap, AlertCircle, CheckCircle2,
  Loader2, ChevronDown, Info, Key,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SystemConfigItem } from '@/types/settings';
import { LLM_PROVIDERS } from '@/lib/llm';

interface SettingsFieldProps {
  config: SystemConfigItem;
  value: string;
  onChange: (key: string, value: string) => void;
  issues?: string[];
  /** All current settings (needed for provider-key dependent fields) */
  allValues?: Record<string, string>;
}

// ─── Connection test button for API Key fields ─────────────────
function ConnectionTestButton({ configKey, apiKey }: { configKey: string; apiKey: string }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const providerId = configKey
    .replace('_API_KEY', '')
    .toLowerCase()
    .replace('sensenova', 'sensenova')
    .replace('openai', 'openai')
    .replace('deepseek', 'deepseek');

  const handleTest = useCallback(async () => {
    if (!apiKey) return;
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setTesting(false);
      // Auto-clear success after 5s
      setTimeout(() => setResult(null), 5000);
    }
  }, [providerId, apiKey]);

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={handleTest}
        disabled={!apiKey || testing}
      >
        {testing ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Zap className="size-3" />
        )}
        {testing ? 'Testing...' : 'Test'}
      </Button>
      {result && (
        <div className="flex items-center gap-1.5 text-xs">
          {result.success ? (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">
                OK ({result.latencyMs}ms)
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="size-3.5 text-destructive" />
              <span className="text-destructive">{result.message}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Provider selector ─────────────────────────────────────────
function ProviderSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="w-full space-y-3">
      <Select
        value={value || 'sensenova'}
        onValueChange={(val) => onChange('LLM_PROVIDER', val)}
      >
        <SelectTrigger className="h-10 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LLM_PROVIDERS.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{provider.name}</span>
                <span className="text-xs text-muted-foreground">
                  {provider.models.length} models
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Model card selector ───────────────────────────────────────
function ModelCardSelector({
  providerId,
  value,
  onChange,
}: {
  providerId: string;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const provider = LLM_PROVIDERS.find((p) => p.id === providerId);
  if (!provider) return null;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {provider.models.map((model) => {
        const isSelected = value === model.id;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => onChange('LITELLM_MODEL', model.id)}
            className={`
              relative text-left rounded-lg border-2 p-3 transition-all
              ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                  : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
              }
            `}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="font-medium text-sm pr-6">{model.name}</div>
              <div className="text-xs text-muted-foreground">{model.description}</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {model.contextWindow}
                </Badge>
                {model.features.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main field component ─────────────────────────────────────
export function SettingsField({
  config,
  value,
  onChange,
  issues = [],
  allValues = {},
}: SettingsFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const hasIssues = issues.length > 0;

  const renderInput = () => {
    switch (config.type) {
      // ─── Toggle ──────────────────────────────────────
      case 'toggle':
        return (
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) =>
              onChange(config.key, checked ? 'true' : 'false')
            }
          />
        );

      // ─── Provider selector ───────────────────────────
      case 'provider':
        return (
          <ProviderSelector value={value} onChange={onChange} />
        );

      // ─── Model card selector ─────────────────────────
      case 'model_select': {
        const providerId = allValues['LLM_PROVIDER'] || value ? guessProvider(value) : 'sensenova';
        return (
          <ModelCardSelector
            providerId={providerId}
            value={value}
            onChange={onChange}
          />
        );
      }

      // ─── Select dropdown ─────────────────────────────
      case 'select':
        return (
          <Select
            value={value || config.options?.[0] || ''}
            onValueChange={(val) => onChange(config.key, val)}
          >
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      // ─── Number ──────────────────────────────────────
      case 'number':
        return (
          <Input
            type="number"
            step="any"
            value={value}
            onChange={(e) => onChange(config.key, e.target.value)}
            className={`w-48 h-9 text-sm ${hasIssues ? 'border-destructive' : ''}`}
          />
        );

      // ─── Password (API Key) with test button ─────────
      case 'password': {
        const hasValue = !!value;
        return (
          <div className="w-full">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={value}
                  onChange={(e) => onChange(config.key, e.target.value)}
                  placeholder="sk-..."
                  className={`h-9 text-sm pr-10 ${hasIssues ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {hasValue && (
                <ConnectionTestButton
                  configKey={config.key}
                  apiKey={value}
                />
              )}
            </div>
            {!hasValue && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Key className="size-3" />
                未配置时将使用环境变量中的密钥
              </p>
            )}
          </div>
        );
      }

      // ─── Text ────────────────────────────────────────
      case 'text':
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(config.key, e.target.value)}
            className={`w-48 h-9 text-sm ${hasIssues ? 'border-destructive' : ''}`}
          />
        );
    }
  };

  // Provider and model_select fields render full-width below the label
  const isFullWidth = config.type === 'provider' || config.type === 'model_select' || config.type === 'password';

  return (
    <div className="space-y-2 py-3">
      <div
        className={`flex items-start justify-between gap-4 ${
          isFullWidth ? 'flex-col' : ''
        }`}
      >
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`setting-${config.key}`}
              className="text-sm font-medium cursor-pointer"
            >
              {config.label}
            </Label>
            {config.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    {config.description}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {!isFullWidth && config.description && (
            <p className="text-xs text-muted-foreground">{config.description}</p>
          )}
        </div>
        <div className="shrink-0 w-full">{renderInput()}</div>
      </div>
      {hasIssues && (
        <div className="space-y-1 pl-0.5">
          {issues.map((issue, idx) => (
            <p key={idx} className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" />
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────
/** Guess which provider a model ID belongs to */
function guessProvider(modelId: string): string {
  if (!modelId) return 'sensenova';
  for (const provider of LLM_PROVIDERS) {
    if (provider.models.some((m) => m.id === modelId)) {
      return provider.id;
    }
  }
  return 'sensenova';
}
