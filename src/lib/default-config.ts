export interface ConfigDef {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'toggle' | 'password' | 'provider' | 'model_select';
  options?: string[];
  default: string;
  category: string;
  /** Extra metadata for custom renderers (e.g. provider/model info) */
  meta?: Record<string, unknown>;
}

export const DEFAULT_CONFIG: Record<string, ConfigDef> = {
  // ─── Base ─────────────────────────────────────────────
  STOCK_LIST: {
    key: 'STOCK_LIST',
    label: '自选股列表',
    description: '逗号分隔的股票代码（最多50只）',
    type: 'text',
    default: '',
    category: 'base',
  },
  REPORT_LANGUAGE: {
    key: 'REPORT_LANGUAGE',
    label: '报告语言',
    description: '分析报告和聊天回复使用的语言',
    type: 'select',
    options: ['zh', 'en'],
    default: 'zh',
    category: 'base',
  },

  // ─── AI Model Provider ───────────────────────────────
  LLM_PROVIDER: {
    key: 'LLM_PROVIDER',
    label: 'AI 供应商',
    description: '选择 AI 模型服务供应商',
    type: 'provider',
    default: 'sensenova',
    category: 'ai_model',
  },
  LITELLM_MODEL: {
    key: 'LITELLM_MODEL',
    label: 'AI 模型',
    description: '选择当前供应商下的模型',
    type: 'model_select',
    default: 'deepseek-v4-flash',
    category: 'ai_model',
  },
  LLM_TEMPERATURE: {
    key: 'LLM_TEMPERATURE',
    label: '温度参数',
    description: '控制输出随机性（0=确定性，2=高随机性）',
    type: 'number',
    default: '0.7',
    category: 'ai_model',
  },
  SENSENOVA_API_KEY: {
    key: 'SENSENOVA_API_KEY',
    label: '日日新 API Key',
    description: 'SenseNova 平台的 API 密钥（token.sensenova.cn）',
    type: 'password',
    default: '',
    category: 'ai_model',
  },
  OPENAI_API_KEY: {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI API Key',
    description: 'OpenAI 平台的 API 密钥（api.openai.com）',
    type: 'password',
    default: '',
    category: 'ai_model',
  },
  DEEPSEEK_API_KEY: {
    key: 'DEEPSEEK_API_KEY',
    label: 'DeepSeek API Key',
    description: 'DeepSeek 官方 API 密钥（api.deepseek.com）',
    type: 'password',
    default: '',
    category: 'ai_model',
  },

  // ─── Data source ─────────────────────────────────────
  ENABLE_REALTIME_QUOTE: {
    key: 'ENABLE_REALTIME_QUOTE',
    label: '实时行情',
    description: '启用实时行情数据获取',
    type: 'toggle',
    default: 'true',
    category: 'data_source',
  },
  REALTIME_SOURCE_PRIORITY: {
    key: 'REALTIME_SOURCE_PRIORITY',
    label: '数据源优先级',
    description: '按优先级排列，逗号分隔',
    type: 'text',
    default: 'tencent,akshare_sina',
    category: 'data_source',
  },

  // ─── Analysis ────────────────────────────────────────
  BIAS_THRESHOLD: {
    key: 'BIAS_THRESHOLD',
    label: '乖离率阈值(%)',
    description: '超过此阈值时提示不追高',
    type: 'number',
    default: '5.0',
    category: 'analysis',
  },
  NEWS_MAX_AGE_DAYS: {
    key: 'NEWS_MAX_AGE_DAYS',
    label: '新闻最大时效(天)',
    description: '只分析最近N天内的相关新闻',
    type: 'number',
    default: '3',
    category: 'analysis',
  },
  ENABLE_CHIP_DISTRIBUTION: {
    key: 'ENABLE_CHIP_DISTRIBUTION',
    label: '筹码分布',
    description: '在分析中启用筹码分布分析',
    type: 'toggle',
    default: 'true',
    category: 'analysis',
  },

  // ─── Notification ────────────────────────────────────
  ENABLE_NOTIFICATION: {
    key: 'ENABLE_NOTIFICATION',
    label: '启用推送通知',
    description: '启用分析结果推送通知',
    type: 'toggle',
    default: 'false',
    category: 'notification',
  },

  // ─── System ──────────────────────────────────────────
  MAX_WORKERS: {
    key: 'MAX_WORKERS',
    label: '最大并发数',
    description: '批量分析时并行执行的最大数量',
    type: 'number',
    default: '3',
    category: 'system',
  },
  SCHEDULE_TIME: {
    key: 'SCHEDULE_TIME',
    label: '定时推送时间',
    description: '每日自动分析推送时间（HH:MM 格式）',
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
