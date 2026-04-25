'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Save, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SettingsField } from './settings-field';
import { SettingsCategoryNav } from './settings-category-nav';
import type { SystemConfigItem, ConfigCategory } from '@/types/settings';
import { DEFAULT_CONFIG } from '@/lib/default-config';

export function SettingsView() {
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('base');
  const [settings, setSettings] = useState<SystemConfigItem[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [validationIssues, setValidationIssues] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const grouped = await res.json();
        // Flatten grouped object into array
        const all: SystemConfigItem[] = [];
        for (const category of Object.keys(grouped)) {
          const items = grouped[category];
          if (Array.isArray(items)) {
            all.push(...items);
          }
        }
        setSettings(all);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = useCallback((key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
    // Clear issues for this key when value changes
    setValidationIssues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveSuccess(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Validate all edited values
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

      // If there are issues, don't save
      const hasErrors = Object.values(newIssues).some((i) => i.length > 0);
      if (hasErrors) {
        setSaving(false);
        return;
      }

      // Build settings array to save
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
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }, [editedValues, fetchSettings]);

  const handleReset = useCallback(() => {
    setEditedValues({});
    setValidationIssues({});
    setSaveSuccess(false);
  }, []);

  // Get current value for a config item
  const getValue = (config: SystemConfigItem): string => {
    if (config.key in editedValues) {
      return editedValues[config.key];
    }
    return config.value || DEFAULT_CONFIG[config.key]?.default || '';
  };

  // Filter settings for the active category
  const categorySettings = settings.filter(
    (s) => s.category === activeCategory
  );

  // Compute issue counts per category
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

  // Check if there are unsaved changes
  const hasChanges = Object.keys(editedValues).length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system configuration and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>Saved</span>
            </div>
          )}
          {Object.keys(validationIssues).length > 0 && Object.values(validationIssues).some(i => i.length > 0) && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4" />
              <span>Has issues</span>
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
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saving ? 'Saving...' : 'Save'}
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
              <CardTitle className="text-sm font-semibold">
                {activeCategory === 'base' && '基础设置'}
                {activeCategory === 'ai_model' && 'AI 模型'}
                {activeCategory === 'data_source' && '数据源'}
                {activeCategory === 'notification' && '通知渠道'}
                {activeCategory === 'analysis' && '分析配置'}
                {activeCategory === 'system' && '系统'}
              </CardTitle>
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
                  No settings in this category.
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
