import { NextRequest, NextResponse } from 'next/server';

const FINANCE_BASE = 'https://internal-api.z.ai/external/finance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker || ticker.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "ticker" is required' },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${FINANCE_BASE}/v1/quote?ticker=${encodeURIComponent(ticker.trim())}`,
      {
        headers: { 'X-Z-AI-From': 'Z' },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Finance API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Quote fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
