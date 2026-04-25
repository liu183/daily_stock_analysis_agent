export interface ConfigDef {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'password';
  options?: string[];
  default: string;
  category: string;
}

export const DEFAULT_CONFIG: Record<string, ConfigDef> = {
  // Base
  STOCK_LIST: {
    key: 'STOCK_LIST',
    label: '自选股列表',
    description: '逗号分隔的股票代码',
    type: 'text',
    default: '',
    category: 'base',
  },
  REPORT_LANGUAGE: {
    key: 'REPORT_LANGUAGE',
    label: '报告语言',
    description: 'zh / en',
    type: 'select',
    options: ['zh', 'en'],
    default: 'zh',
    category: 'base',
  },

  // AI Model
  LITELLM_MODEL: {
    key: 'LITELLM_MODEL',
    label: 'AI 模型',
    description: 'LiteLLM 模型标识',
    type: 'text',
    default: 'gemini/gemini-2.5-flash',
    category: 'ai_model',
  },
  LLM_TEMPERATURE: {
    key: 'LLM_TEMPERATURE',
    label: '温度参数',
    description: '0.0 - 2.0',
    type: 'number',
    default: '0.7',
    category: 'ai_model',
  },

  // Data source
  ENABLE_REALTIME_QUOTE: {
    key: 'ENABLE_REALTIME_QUOTE',
    label: '实时行情',
    description: '启用实时行情数据',
    type: 'toggle',
    default: 'true',
    category: 'data_source',
  },
  REALTIME_SOURCE_PRIORITY: {
    key: 'REALTIME_SOURCE_PRIORITY',
    label: '数据源优先级',
    description: '逗号分隔',
    type: 'text',
    default: 'tencent,akshare_sina',
    category: 'data_source',
  },

  // Analysis
  BIAS_THRESHOLD: {
    key: 'BIAS_THRESHOLD',
    label: '乖离率阈值(%)',
    description: '超过提示不追高',
    type: 'number',
    default: '5.0',
    category: 'analysis',
  },
  NEWS_MAX_AGE_DAYS: {
    key: 'NEWS_MAX_AGE_DAYS',
    label: '新闻最大时效(天)',
    description: '',
    type: 'number',
    default: '3',
    category: 'analysis',
  },
  ENABLE_CHIP_DISTRIBUTION: {
    key: 'ENABLE_CHIP_DISTRIBUTION',
    label: '筹码分布',
    description: '启用筹码分布分析',
    type: 'toggle',
    default: 'true',
    category: 'analysis',
  },

  // Notification
  ENABLE_NOTIFICATION: {
    key: 'ENABLE_NOTIFICATION',
    label: '启用推送通知',
    description: '启用推送通知功能',
    type: 'toggle',
    default: 'false',
    category: 'notification',
  },

  // System
  MAX_WORKERS: {
    key: 'MAX_WORKERS',
    label: '最大并发数',
    description: '任务并行执行最大数量',
    type: 'number',
    default: '3',
    category: 'system',
  },
  SCHEDULE_TIME: {
    key: 'SCHEDULE_TIME',
    label: '定时推送时间',
    description: 'HH:MM 格式',
    type: 'text',
    default: '18:00',
    category: 'system',
  },
};

export function getConfigDefsByCategory(category: string): ConfigDef[] {
  return Object.values(DEFAULT_CONFIG).filter((d) => d.category === category);
}

export function getAllConfigKeys(): string[] {
  return Object.keys(DEFAULT_CONFIG);
}
