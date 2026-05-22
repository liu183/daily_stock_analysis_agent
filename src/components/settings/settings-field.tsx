'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
import type { SystemConfigItem } from '@/types/settings';

interface SettingsFieldProps {
  config: SystemConfigItem;
  value: string;
  onChange: (key: string, value: string) => void;
  issues?: string[];
}

export function SettingsField({
  config,
  value,
  onChange,
  issues = [],
}: SettingsFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const hasIssues = issues.length > 0;

  const renderInput = () => {
    switch (config.type) {
      case 'toggle':
        return (
          <Switch
            checked={value === 'true'}
            onCheckedChange={(checked) =>
              onChange(config.key, checked ? 'true' : 'false')
            }
          />
        );

      case 'select':
        // Rich model selector for AI model config
        if (config.key === 'LITELLM_MODEL') {
          const modelOptions = [
            { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', desc: '256K上下文 · 思考模式 · 工具调用' },
            { value: 'sensenova-6.7-flash-lite', label: 'SenseNova 6.7 Flash-Lite', desc: '多模态 · 轻量快速' },
            { value: 'sensenova-u1-fast', label: 'SenseNova U1 Fast', desc: '信息图生成专用' },
          ];
          const selected = modelOptions.find(o => o.value === value);
          return (
            <Select value={value || 'deepseek-v4-flash'} onValueChange={(val) => onChange(config.key, val)}>
              <SelectTrigger className="w-72 h-9 text-sm">
                <SelectValue>
                  {selected ? (
                    <span className="flex items-center gap-2">
                      <span>{selected.label}</span>
                      <span className="text-xs text-muted-foreground">{selected.desc}</span>
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        return (
          <Select
            value={value || config.type}
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

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(config.key, e.target.value)}
            className={`w-48 h-9 text-sm ${hasIssues ? 'border-destructive' : ''}`}
          />
        );

      case 'password':
        return (
          <div className="relative w-48">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange(config.key, e.target.value)}
              placeholder="••••••••"
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
        );

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

  return (
    <div className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 flex-1 min-w-0">
          <Label
            htmlFor={`setting-${config.key}`}
            className="text-sm font-medium cursor-pointer"
          >
            {config.label}
          </Label>
          {config.description && (
            <p className="text-xs text-muted-foreground">{config.description}</p>
          )}
        </div>
        <div className="shrink-0">{renderInput()}</div>
      </div>
      {hasIssues && (
        <div className="space-y-1 pl-0.5">
          {issues.map((issue, idx) => (
            <p key={idx} className="text-xs text-destructive">
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
