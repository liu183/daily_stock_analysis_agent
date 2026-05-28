/**
 * Multi-provider LLM Client
 * Supports SenseNova, OpenAI, DeepSeek, and Xiaomi providers
 * Uses the OpenAI SDK (all providers are OpenAI-compatible)
 */

import OpenAI from 'openai';

// ─── Provider definitions ──────────────────────────────────────────
export interface LLMProviderDef {
  id: string;
  name: string;
  baseURL: string;
  envKey: string;       // env var name for API key
  configKey: string;    // SystemConfig key for API key
  models: LLMModelDef[];
}

export interface LLMModelDef {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  features: string[];
}

export const LLM_PROVIDERS: LLMProviderDef[] = [
  {
    id: 'sensenova',
    name: '日日新 SenseNova',
    baseURL: 'https://token.sensenova.cn/v1',
    envKey: 'SENSENOVA_API_KEY',
    configKey: 'SENSENOVA_API_KEY',
    models: [
      {
        id: 'deepseek-v4-flash',
        name: 'DeepSeek V4 Flash',
        description: '默认推荐模型，思考模式 + 工具调用',
        contextWindow: '256K',
        features: ['深度思考', '工具调用', 'JSON输出'],
      },
      {
        id: 'sensenova-6.7-flash-lite',
        name: 'SenseNova 6.7 Flash-Lite',
        description: '轻量快速，适合简单分析',
        contextWindow: '128K',
        features: ['多模态', '轻量快速', '低成本'],
      },
      {
        id: 'sensenova-u1-fast',
        name: 'SenseNova U1 Fast',
        description: '信息图生成专用模型',
        contextWindow: '64K',
        features: ['图表理解', '信息抽取', '快速推理'],
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
    configKey: 'OPENAI_API_KEY',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'OpenAI 旗舰多模态模型',
        contextWindow: '128K',
        features: ['多模态', '函数调用', 'JSON模式'],
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: '高性价比快速模型',
        contextWindow: '128K',
        features: ['快速响应', '低成本', '结构化输出'],
      },
      {
        id: 'o3-mini',
        name: 'O3 Mini',
        description: '推理增强模型',
        contextWindow: '200K',
        features: ['深度推理', '编码能力', '数学推理'],
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek 官方',
    baseURL: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
    configKey: 'DEEPSEEK_API_KEY',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3',
        description: 'DeepSeek 通用对话模型',
        contextWindow: '64K',
        features: ['通用对话', '代码生成', '知识问答'],
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1',
        description: '深度推理模型，复杂分析首选',
        contextWindow: '64K',
        features: ['深度推理', '链式思考', '复杂分析'],
      },
    ],
  },
  {
    id: 'xiaomi',
    name: '小米 Xiaomi',
    baseURL: 'https://token-plan-ams.xiaomimimo.com/v1',
    envKey: 'XIAOMI_API_KEY',
    configKey: 'XIAOMI_API_KEY',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'OpenAI 旗舰多模态模型（通过小米代理）',
        contextWindow: '128K',
        features: ['多模态', '函数调用', 'JSON模式'],
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: '高性价比快速模型（通过小米代理）',
        contextWindow: '128K',
        features: ['快速响应', '低成本', '结构化输出'],
      },
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3',
        description: 'DeepSeek 通用对话模型（通过小米代理）',
        contextWindow: '64K',
        features: ['通用对话', '代码生成', '知识问答'],
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1',
        description: '深度推理模型（通过小米代理）',
        contextWindow: '64K',
        features: ['深度推理', '链式思考', '复杂分析'],
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        description: 'Anthropic 旗舰模型（通过小米代理）',
        contextWindow: '200K',
        features: ['多模态', '深度推理', '长文本'],
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Anthropic 快速模型（通过小米代理）',
        contextWindow: '200K',
        features: ['快速响应', '低成本', '高智能'],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────
export function getProvider(providerId: string): LLMProviderDef | undefined {
  return LLM_PROVIDERS.find((p) => p.id === providerId);
}

export function getModel(providerId: string, modelId: string): LLMModelDef | undefined {
  const provider = getProvider(providerId);
  return provider?.models.find((m) => m.id === modelId);
}

export function getAllModels(): Array<{ providerId: string; providerName: string; model: LLMModelDef }> {
  return LLM_PROVIDERS.flatMap((p) =>
    p.models.map((m) => ({
      providerId: p.id,
      providerName: p.name,
      model: m,
    }))
  );
}

// ─── Client factory ──────────────────────────────────────────────
function getClient(
  providerId: string,
  apiKeyOverride?: string
): OpenAI {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown LLM provider: ${providerId}`);
  }

  const apiKey = apiKeyOverride || process.env[provider.envKey];
  if (!apiKey) {
    throw new Error(
      `API key not configured for ${provider.name}. ` +
      `Please set ${provider.envKey} in .env or configure it in settings.`
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: provider.baseURL,
  });
}

// ─── Interfaces ──────────────────────────────────────────────────
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  providerId?: string;
  apiKey?: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ─── Core API ────────────────────────────────────────────────────
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const providerId = options.providerId || 'sensenova';
  const client = getClient(providerId, options.apiKey);
  const model = options.model || getProvider(providerId)?.models[0]?.id || 'deepseek-v4-flash';

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
    });

    return {
      id: completion.id,
      choices: completion.choices.map((c) => ({
        index: c.index,
        message: {
          role: c.message.role,
          content: c.message.content ?? '',
        },
        finish_reason: c.finish_reason ?? 'stop',
      })),
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error: unknown) {
    if (error instanceof OpenAI.APIError) {
      const providerName = getProvider(providerId)?.name || providerId;
      throw new Error(
        `${providerName} API error (${error.status}): ${error.message}`
      );
    }
    throw error;
  }
}

/** Shorthand: send messages and get the assistant reply text */
export async function chat(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    providerId?: string;
    apiKey?: string;
  }
): Promise<string> {
  const completion = await createChatCompletion({
    messages,
    ...options,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned empty response');
  }
  return content;
}

/** Test API connection with a minimal request */
export async function testConnection(
  providerId: string,
  apiKey: string,
  modelId?: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const provider = getProvider(providerId);
  if (!provider) {
    return { success: false, message: `Unknown provider: ${providerId}` };
  }

  const model = modelId || provider.models[0]?.id;
  const startTime = Date.now();

  try {
    const client = getClient(providerId, apiKey);
    const completion = await client.chat.completions.create({
      model: model || provider.models[0]?.id,
      messages: [{ role: 'user', content: 'Hi, respond with just "OK"' }],
      max_tokens: 10,
      temperature: 0,
    });

    const latency = Date.now() - startTime;
    const reply = completion.choices[0]?.message?.content || '';

    return {
      success: true,
      message: `Connected successfully. Response: "${reply.trim()}"`,
      latencyMs: latency,
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    if (error instanceof OpenAI.APIError) {
      return {
        success: false,
        message: `API error (${error.status}): ${error.message}`,
        latencyMs: latency,
      };
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: msg,
      latencyMs: latency,
    };
  }
}
