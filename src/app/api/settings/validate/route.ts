import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_CONFIG, type ConfigDef } from '@/lib/default-config';

function basicValidate(key: string, value: string, def: ConfigDef): string[] {
  const issues: string[] = [];

  if (def.type === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      issues.push('请输入有效数字');
    } else if (def.key === 'LLM_TEMPERATURE' && (num < 0 || num > 2)) {
      issues.push('温度参数应在 0.0 - 2.0 之间');
    } else if (def.key === 'BIAS_THRESHOLD' && (num < 0 || num > 100)) {
      issues.push('乖离率阈值应在 0 - 100 之间');
    } else if (def.key === 'NEWS_MAX_AGE_DAYS' && (num < 1 || num > 365)) {
      issues.push('新闻时效应在 1 - 365 天之间');
    } else if (def.key === 'MAX_WORKERS' && (num < 1 || num > 10)) {
      issues.push('并发数应在 1 - 10 之间');
    }
  }

  if (def.type === 'select' && def.options && !def.options.includes(value)) {
    issues.push(`请选择有效选项: ${def.options.join(', ')}`);
  }

  if (def.key === 'SCHEDULE_TIME') {
    const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      issues.push('时间格式应为 HH:MM (例如 18:00)');
    }
  }

  if (def.key === 'STOCK_LIST' && value.trim()) {
    const codes = value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (codes.length > 50) {
      issues.push('自选股最多支持 50 只');
    }
  }

  return issues;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Missing key' },
        { status: 400 }
      );
    }

    const def = DEFAULT_CONFIG[key];
    if (!def) {
      return NextResponse.json(
        { error: `Unknown config key: ${key}` },
        { status: 400 }
      );
    }

    const strValue = value === null || value === undefined ? '' : String(value);
    const issues = basicValidate(key, strValue, def);

    return NextResponse.json({
      key,
      value: strValue,
      valid: issues.length === 0,
      issues,
    });
  } catch (error) {
    console.error('Failed to validate config:', error);
    return NextResponse.json(
      { error: 'Failed to validate config' },
      { status: 500 }
    );
  }
}
