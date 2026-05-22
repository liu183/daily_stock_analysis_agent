/**
 * SenseNova (日日新) LLM Client
 * Uses the OpenAI SDK to connect to SenseNova's API
 */

import OpenAI from 'openai';

const SENSENOVA_BASE_URL = 'https://token.sensenova.cn/v1';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const FALLBACK_API_KEY = 'sk-DX5ErIS9LuyKX765zWEeJaWOPQuXKOfL';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
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

function getClient(): OpenAI {
  const apiKey = process.env.SENSENOVA_API_KEY || FALLBACK_API_KEY;

  return new OpenAI({
    apiKey,
    baseURL: SENSENOVA_BASE_URL,
  });
}

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const client = getClient();
  const model = options.model || DEFAULT_MODEL;

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
      throw new Error(
        `SenseNova API error (${error.status}): ${error.message}`
      );
    }
    throw error;
  }
}

/** Shorthand: send messages and get the assistant reply text */
export async function chat(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const completion = await createChatCompletion({
    messages,
    ...options,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('SenseNova API returned empty response');
  }
  return content;
}
