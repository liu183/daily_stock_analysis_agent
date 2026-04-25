import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/chat/[sessionId]/export — Export a session as markdown
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    // Build markdown content
    const lines: string[] = [];

    lines.push(`# ${session.title}`);
    lines.push('');
    lines.push(`> 导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`> 创建时间: ${session.createdAt.toLocaleString('zh-CN')}`);
    lines.push('');

    if (session.stockCode) {
      lines.push(`**股票代码**: ${session.stockCode}`);
      if (session.stockName) {
        lines.push(`**股票名称**: ${session.stockName}`);
      }
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    for (const msg of messages) {
      if (msg.role === 'user') {
        lines.push('## 👤 用户');
        lines.push('');
        lines.push(msg.content);
        lines.push('');
      } else {
        lines.push('## 🤖 AI 分析师');
        if (msg.skillName) {
          lines.push(`> 策略: ${msg.skillName}`);
        }
        lines.push('');
        lines.push(msg.content);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    }

    lines.push('');
    lines.push('⚠️ 以上分析仅供参考，不构成投资建议，投资有风险，入市需谨慎。');

    const markdown = lines.join('\n');
    const filename = `${session.title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')}_${new Date().toISOString().slice(0, 10)}.md`;

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
