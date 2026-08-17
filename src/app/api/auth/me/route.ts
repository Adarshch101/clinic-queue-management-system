import { NextResponse } from 'next/server';
import { resolveProfile } from '@/lib/resolveProfile';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const profile = await resolveProfile(session.userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error('API me error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Database lookup failure') : String(error) }, { status: 500 });
  }
}