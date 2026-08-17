import { NextResponse } from 'next/server';
import { resolveProfile } from '@/lib/resolveProfile';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const emailParam = searchParams.get('email')?.toLowerCase();

    const profile = await resolveProfile(userId, emailParam);

    return NextResponse.json(profile);
  } catch (error) {
    console.error('API session error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Database lookup failure') : String(error) }, { status: 500 });
  }
}