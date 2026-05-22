import { db } from '@/lib/db';

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
