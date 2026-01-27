import { NextRequest, NextResponse } from 'next/server';
import { generateSignedUrl } from '@/lib/elevenlabs/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, sessionId, language } = body;

    if (!restaurantId || !tableId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if ElevenLabs is configured
    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_AGENT_ID) {
      return NextResponse.json(
        {
          error: 'Voice service not configured',
          details: 'ElevenLabs API key or Agent ID is missing. Please configure ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID environment variables.',
          configured: false,
        },
        { status: 503 }
      );
    }

    const { signedUrl, expiresAt } = await generateSignedUrl({
      agentId: process.env.ELEVENLABS_AGENT_ID || '',
      restaurantId,
      tableId,
      sessionId,
      language: language || 'en',
    });

    return NextResponse.json({
      signedUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
