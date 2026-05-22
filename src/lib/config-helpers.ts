import { db } from '@/lib/db';
import { getProvider } from '@/lib/llm';

/**
 * Read a config value from the SystemConfig table.
 * Returns the value string or the provided fallback.
 */
export async function getConfigValue(key: string, fallback: string = ''): Promise<string> {
  try {
    const row = await db.systemConfig.findUnique({ where: { key } });
    return row?.value || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Get the active LLM provider ID from config.
 */
export async function getLLMProvider(fallback: string = 'sensenova'): Promise<string> {
  return getConfigValue('LLM_PROVIDER', fallback);
}

/**
 * Get the configured model for the active provider.
 * Falls back to the provider's first model if the stored model doesn't match.
 */
export async function getLLMModel(): Promise<string> {
  const providerId = await getLLMProvider('sensenova');
  const storedModel = await getConfigValue('LITELLM_MODEL', '');
  const provider = getProvider(providerId);

  if (!provider) return 'deepseek-v4-flash';

  // Validate that the stored model belongs to the current provider
  const modelExists = provider.models.some((m) => m.id === storedModel);
  if (modelExists) return storedModel;

  // Fall back to the provider's first model
  return provider.models[0]?.id || 'deepseek-v4-flash';
}

/**
 * Get the temperature setting.
 */
export async function getLLMTemperature(fallback: number = 0.7): Promise<number> {
  const val = await getConfigValue('LLM_TEMPERATURE', String(fallback));
  const num = parseFloat(val);
  return isNaN(num) ? fallback : Math.max(0, Math.min(2, num));
}

/**
 * Get the API key for a given provider.
 * Checks SystemConfig first, then falls back to env var.
 */
export async function getProviderApiKey(providerId: string): Promise<string | null> {
  const provider = getProvider(providerId);
  if (!provider) return null;

  // Check SystemConfig first
  const configValue = await getConfigValue(provider.configKey, '');
  if (configValue) return configValue;

  // Fall back to environment variable
  return process.env[provider.envKey] || null;
}
