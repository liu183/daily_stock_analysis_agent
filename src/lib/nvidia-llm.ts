/**
 * NVIDIA NIM LLM Client
 * OpenAI-compatible API for NVIDIA's model service
 */

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';

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

async function getApiKey(): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY environment variable is not set');
  }
  return apiKey;
}

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  const apiKey = await getApiKey();
  const model = options.model || DEFAULT_MODEL;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<ChatCompletionResponse>;
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
    throw new Error('NVIDIA API returned empty response');
  }
  return content;
}
