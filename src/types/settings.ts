export interface SystemConfigItem {
  id: string;
  key: string;
  value: string | null;
  category: string;
  updatedAt: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'password' | 'provider' | 'model_select';
  options?: string[];
  meta?: Record<string, unknown>;
  issues?: string[];
}

export type ConfigCategory = 'base' | 'ai_model' | 'data_source' | 'notification' | 'analysis' | 'system';

export const CONFIG_CATEGORY_LABELS: Record<ConfigCategory, string> = {
  base: '基础设置',
  ai_model: 'AI 模型',
  data_source: '数据源',
  notification: '通知渠道',
  analysis: '分析配置',
  system: '系统',
};

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  'base',
  'ai_model',
  'data_source',
  'notification',
  'analysis',
  'system',
];
