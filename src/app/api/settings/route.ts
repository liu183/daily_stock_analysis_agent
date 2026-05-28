import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_CONFIG } from '@/lib/default-config';
import type { SystemConfigItem } from '@/types/settings';

function toConfigItem(
  row: { id: string; key: string; value: string | null; category: string; updatedAt: Date },
  label: string,
  description: string,
  type: SystemConfigItem['type'],
  options?: string[]
): SystemConfigItem {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    category: row.category,
    updatedAt: row.updatedAt.toISOString(),
    label,
    description,
    type,
    options,
  };
}

export async function GET() {
  try {
    // Ensure all config keys exist in the database
    const allKeys = Object.keys(DEFAULT_CONFIG);
    for (const key of allKeys) {
      const def = DEFAULT_CONFIG[key];
      await db.systemConfig.upsert({
        where: { key },
        update: {},
        create: {
          key,
          value: def.default,
          category: def.category,
        },
      });
    }

    const rows = await db.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    const grouped: Record<string, SystemConfigItem[]> = {};
    for (const row of rows) {
      const def = DEFAULT_CONFIG[row.key];
      if (!def) continue;
      const item = toConfigItem(
        row,
        def.label,
        def.description,
        def.type,
        def.options
      );
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      grouped[row.category].push(item);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);

    // If DB is down, return default config with a warning header
    const fallback: Record<string, SystemConfigItem[]> = {};
    for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
      if (!fallback[def.category]) {
        fallback[def.category] = [];
      }
      fallback[def.category].push({
        id: `default-${key}`,
        key: def.key,
        value: def.default,
        category: def.category,
        updatedAt: new Date().toISOString(),
        label: def.label,
        description: def.description,
        type: def.type,
        options: def.options,
      });
    }

    const response = NextResponse.json(fallback);
    response.headers.set('X-Settings-Mode', 'fallback');
    response.headers.set('X-Settings-Error', errorMsg);
    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as {
      settings: Array<{ key: string; value: string }>;
    };

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'settings must be an array' },
        { status: 400 }
      );
    }

    const updated: string[] = [];
    for (const item of settings) {
      const def = DEFAULT_CONFIG[item.key];
      if (!def) continue;

      await db.systemConfig.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: {
          key: item.key,
          value: item.value,
          category: def.category,
        },
      });
      updated.push(item.key);
    }

    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Failed to save settings:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `保存失败: ${errorMsg}` },
      { status: 500 }
    );
  }
}
