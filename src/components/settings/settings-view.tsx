'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle2, AlertCircle, Zap, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsField } from './settings-field';
import { SettingsCategoryNav } from './settings-category-nav';
import type { SystemConfigItem, ConfigCategory } from '@/types/settings';
import { DEFAULT_CONFIG } from '@/lib/default-config';
import { getProvider } from '@/lib/llm';

/** Build a fallback SystemConfigItem from DEFAULT_CONFIG when API is unavailable */
function buildFallbackSettings(): SystemConfigItem[] {
  return Object.values(DEFAULT_CONFIG).map((def) => ({
    id: `fallback-${def.key}`,
    key: def.key,
    value: def.default,
    category: def.category,
    updatedAt: new Date().toISOString(),
    label: def.label,
    description: def.description,
    type: def.type,
    options: def.options,
  }));
}

export function SettingsView() {
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('ai_model');
  const [settings, setSettings] = useState<SystemConfigItem[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [validationIssues, setValidationIssues] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const grouped = await res.json();
        const all: SystemConfigItem[] = [];
        for (const category of Object.keys(grouped)) {
          const items = grouped[category];
          if (Array.isArray(items)) {
            all.push(...items);
          }
        }
        setSettings(all);
        setIsOffline(false);
      } else {
        // API returned error - use fallback
        const errText = await res.text().catch(() => 'Unknown error');
        console.error('Settings API error:', res.status, errText);
        setFetchError(`服务器返回 ${res.status} 错误`);
        setSettings(buildFallbackSettings());
        setIsOffline(true);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setFetchError('无法连接到服务器，使用默认配置（仅可预览，无法保存）');
      setSettings(buildFallbackSettings());
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = useCallback((key: string, value: string) => {
    setEditedValues((prev) => {
      const next = { ...prev, [key]: value };

      // When provider changes, auto-select the first model of the new provider
      if (key === 'LLM_PROVIDER') {
        const provider = getProvider(value);
        if (provider && provider.models.length > 0) {
          next['LITELLM_MODEL'] = provider.models[0].id;
        }
      }

      return next;
    });
    // Clear issues for this key when value changes
    setValidationIssues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveSuccess(false);
    setSaveError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (isOffline) {
      setSaveError('数据库未连接，无法保存配置。请检查服务器配置后刷新页面。');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const editedKeys = Object.keys(editedValues);
      const newIssues: Record<string, string[]> = {};

      for (const key of editedKeys) {
        const value = editedValues[key];
        try {
          const res = await fetch('/api/settings/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!data.valid && data.issues?.length > 0) {
              newIssues[key] = data.issues;
            }
          }
        } catch {
          // skip validation on error
        }
      }

      setValidationIssues(newIssues);

      const hasErrors = Object.values(newIssues).some((i) => i.length > 0);
      if (hasErrors) {
        setSaving(false);
        return;
      }

      const toSave = editedKeys.map((key) => ({
        key,
        value: editedValues[key],
      }));

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: toSave }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setEditedValues({});
        await fetchSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errData = await res.json().catch(() => null);
        setSaveError(errData?.error || `保存失败 (${res.status})`);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveError('网络错误，保存失败');
    } finally {
      setSaving(false);
    }
  }, [editedValues, fetchSettings, isOffline]);

  const handleReset = useCallback(() => {
    setEditedValues({});
    setValidationIssues({});
    setSaveSuccess(false);
    setSaveError(null);
  }, []);

  // Get current value for a config item (edited value > db value > default)
  const getValue = (config: SystemConfigItem): string => {
    if (config.key in editedValues) {
      return editedValues[config.key];
    }
    return config.value || DEFAULT_CONFIG[config.key]?.default || '';
  };

  // Get all current values (for provider-dependent fields)
  const getAllValues = useCallback((): Record<string, string> => {
    const all: Record<string, string> = {};
    for (const s of settings) {
      all[s.key] = getValue(s);
    }
    return all;
  }, [settings, editedValues]);

  const categorySettings = settings.filter(
    (s) => s.category === activeCategory
  );

  const issueCounts: Record<string, number> = {};
  for (const key of Object.keys(validationIssues)) {
    const issues = validationIssues[key];
    if (issues.length > 0) {
      const def = DEFAULT_CONFIG[key];
      if (def) {
        const cat = def.category;
        issueCounts[cat] = (issueCounts[cat] || 0) + 1;
      }
    }
  }

  const hasChanges = Object.keys(editedValues).length > 0;

  // Category title map
  const categoryTitles: Record<string, string> = {
    base: '基础设置',
    ai_model: 'AI 模型配置',
    data_source: '数据源',
    notification: '通知渠道',
    analysis: '分析配置',
    system: '系统',
  };

  const categoryDescriptions: Record<string, string> = {
    base: '管理自选股列表和报告语言等基础配置',
    ai_model: '配置 AI 供应商、选择模型、设置 API 密钥和温度参数',
    data_source: '配置实时行情数据源',
    notification: '管理推送通知渠道',
    analysis: '调整分析参数和阈值',
    system: '系统性能和定时任务配置',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Offline warning banner */}
      {isOffline && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3">
          <Database className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              数据库未连接
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {fetchError || '当前使用默认配置，修改无法保存。请检查服务器 DATABASE_URL 配置。'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            className="shrink-0 h-8 gap-1.5 text-xs border-amber-400 dark:border-amber-600"
          >
            <RefreshCw className="size-3" />
            重试连接
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置 AI 模型供应商、分析参数和系统偏好
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>保存成功</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4" />
              <span>{saveError}</span>
            </div>
          )}
          {Object.keys(validationIssues).length > 0 &&
            Object.values(validationIssues).some((i) => i.length > 0) && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="size-4" />
                <span>存在配置问题</span>
              </div>
            )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
            className="h-9 gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            重置
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges || isOffline}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* Layout: sidebar + main */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category nav sidebar */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="pt-4 pb-4">
              <SettingsCategoryNav
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
                issueCounts={issueCounts}
              />
            </CardContent>
          </Card>
        </div>

        {/* Settings fields */}
        <div className="lg:col-span-9">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {categoryTitles[activeCategory] || activeCategory}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {categoryDescriptions[activeCategory] || ''}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                      <div className="h-9 w-48 rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : categorySettings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  该分类暂无配置项
                </p>
              ) : (
                <div className="divide-y">
                  {categorySettings.map((config) => (
                    <SettingsField
                      key={config.key}
                      config={config}
                      value={getValue(config)}
                      onChange={handleChange}
                      issues={validationIssues[config.key]}
                      allValues={getAllValues()}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
