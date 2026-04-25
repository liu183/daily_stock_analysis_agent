import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AnalysisTask } from '@/types/stock';

// GET /api/tasks — list active/recent tasks
export async function GET() {
  try {
    const tasks = await db.task.findMany({
      where: {
        status: { in: ['pending', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const items: AnalysisTask[] = tasks.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      stockCode: t.stockCode ?? '',
      stockName: t.stockName ?? '',
      progress: t.progress,
      message: t.message ?? '',
    }));

    return NextResponse.json(items);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load tasks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/tasks — create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, stockCode, stockName } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'type is required' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        type,
        stockCode: stockCode ?? '',
        stockName: stockName ?? '',
        status: 'pending',
        progress: 0,
        message: 'Task created',
      },
    });

    const item: AnalysisTask = {
      id: task.id,
      type: task.type,
      status: task.status,
      stockCode: task.stockCode ?? '',
      stockName: task.stockName ?? '',
      progress: task.progress,
      message: task.message ?? '',
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
