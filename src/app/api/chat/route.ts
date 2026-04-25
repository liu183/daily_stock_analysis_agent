import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/chat — List all chat sessions
export async function GET() {
  try {
    const sessions = await db.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        stockCode: true,
        stockName: true,
        messageCount: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/chat — Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, stockCode, stockName } = body;

    const session = await db.chatSession.create({
      data: {
        title: title || '新对话',
        stockCode: stockCode || null,
        stockName: stockName || null,
      },
    });

    return NextResponse.json(session);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
