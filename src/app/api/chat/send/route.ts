import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildStockContext } from '@/lib/stock-data-context';
import ZAI from 'z-ai-web-dev-sdk';

const STRATEGY_PROMPTS: Record<string, string> = {
  '均线金叉': '请重点分析均线系统，包括MA5、MA10、MA20、MA60的金叉死叉关系，判断短期和中期趋势。结合均线多头排列/空头排列给出买卖建议。',
  '缠论': '请运用缠论技术分析方法，分析走势的笔、线段、中枢结构，判断当前处于上涨、下跌还是盘整走势类型，并找出三类买卖点。',
  '波浪理论': '请运用艾略特波浪理论，分析当前股价所处的波浪位置（推动浪或调整浪），判断当前是第几浪，并预测后续走势。',
  '多头趋势': '请重点分析股票是否处于多头趋势中，包括均线排列、成交量配合、MACD指标等，判断多头趋势的强度和持续性。',
  '箱体震荡': '请分析股票是否处于箱体震荡格局，找出支撑位和压力位区间，判断突破方向和操作策略。',
  '情绪周期': '请从市场情绪角度分析，包括恐慌贪婪指数、资金流向、北向资金/南向资金动向、板块轮动等，判断情绪周期的阶段。',
  '底部放量': '请重点分析底部放量特征，包括地量见地价、底部温和放量、突破放量等形态，判断是否处于底部反转阶段。',
  '缩量回调': '请分析缩量回调的特征，判断是健康调整还是趋势转弱，结合关键支撑位给出加仓或减仓建议。',
};

function buildSystemPrompt(skill?: string): string {
  let strategy = '';
  if (skill && skill !== '通用分析' && STRATEGY_PROMPTS[skill]) {
    strategy = `\n\n## 当前选择的策略: ${skill}\n${STRATEGY_PROMPTS[skill]}`;
  }

  return `你是一位经验丰富的中国A股/港股/美股资深分析师，擅长基本面分析和技术面分析。

## 你的职责
1. 基于用户的问题和提供的实时行情数据，给出专业的股票分析意见
2. 使用清晰的 Markdown 格式输出分析结果
3. 每次分析必须包含：
   - **趋势判断**：当前处于上涨/下跌/震荡趋势
   - **关键点位**：支撑位和压力位
   - **操作建议**：买入/卖出/持有，附带理由
   - **风险提示**：可能的风险因素

## 注意事项
- 如果有实时行情数据，必须引用具体数据进行分析
- 所有分析应客观、数据驱动，不做盲目看多或看空
- 必须在每次分析结尾包含风险提示：⚠️ 以上分析仅供参考，不构成投资建议，投资有风险，入市需谨慎。
- 使用表格、列表等格式让内容更清晰易读
- 如果用户问到的股票没有实时数据，请基于你的知识给出分析，并说明数据可能不是最新的
- 回答应使用中文${strategy}`;
}

// POST /api/chat/send — Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, skill } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // Step 1: Create session if not exists
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      // Generate a title from the first message
      const title = trimmedMessage.length > 30
        ? trimmedMessage.substring(0, 30) + '...'
        : trimmedMessage;

      const session = await db.chatSession.create({
        data: { title },
      });
      activeSessionId = session.id;
    }

    // Step 2: Save user message
    await db.chatMessage.create({
      data: {
        sessionId: activeSessionId,
        role: 'user',
        content: trimmedMessage,
        skillName: skill || null,
      },
    });

    // Step 3: Load conversation history
    const history = await db.chatMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: 'asc' },
    });

    // Build conversation messages for LLM
    const conversationMessages: Array<{ role: string; content: string }> = [];
    for (const msg of history) {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Step 4: Fetch stock data context
    const stockContext = await buildStockContext(trimmedMessage);

    // Step 5: Inject stock context into the last user message
    if (stockContext && conversationMessages.length > 0) {
      const lastMsg = conversationMessages[conversationMessages.length - 1];
      lastMsg.content = lastMsg.content + stockContext;
    }

    // Step 6: Call LLM
    const systemPrompt = buildSystemPrompt(skill);
    const zai = await ZAI.create();

    const startTime = Date.now();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationMessages,
      ],
      thinking: { type: 'disabled' },
    });

    const duration = Date.now() - startTime;
    const aiContent = completion.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error('AI returned empty response');
    }

    // Step 7: Save assistant message
    const savedMsg = await db.chatMessage.create({
      data: {
        sessionId: activeSessionId,
        role: 'assistant',
        content: aiContent,
        skillName: skill || null,
        thinkingSteps: JSON.stringify([
          { type: 'thinking', message: '正在分析您的问题...', step: 1, duration: Math.round(duration * 0.2) },
          { type: 'thinking', message: '正在获取行情数据...', step: 2, duration: stockContext ? Math.round(duration * 0.3) : 0 },
          { type: 'generating', message: '正在生成分析报告...', step: 3, duration: Math.round(duration * 0.5) },
        ]),
      },
    });

    // Step 8: Update session
    await db.chatSession.update({
      where: { id: activeSessionId },
      data: {
        messageCount: { increment: 2 },
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      messageId: savedMsg.id,
      sessionId: activeSessionId,
      content: aiContent,
      skillName: skill || null,
      thinkingSteps: [
        { type: 'thinking', message: '正在分析您的问题...', step: 1, duration: Math.round(duration * 0.2) },
        { type: 'thinking', message: '正在获取行情数据...', step: 2, duration: stockContext ? Math.round(duration * 0.3) : 0 },
        { type: 'generating', message: '正在生成分析报告...', step: 3, duration: Math.round(duration * 0.5) },
      ],
      createdAt: savedMsg.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
