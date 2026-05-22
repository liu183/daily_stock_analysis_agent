import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, apiKey } = body;

    if (!providerId || !apiKey) {
      return NextResponse.json(
        { success: false, message: 'providerId and apiKey are required' },
        { status: 400 }
      );
    }

    const result = await testConnection(providerId, apiKey);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Connection test failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
