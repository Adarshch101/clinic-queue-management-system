import { NextResponse } from 'next/server';
import { resolveProfile } from '@/lib/resolveProfile';
import { getSessionFromRequest } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';

/**
 * Resolves the caller's own platform profile (role, clinic, permissions).
 *
 * The profile is only returned when the caller can prove ownership of the
 * requested userId via one of:
 *  1. The signed server-side session cookie (session.userId === requested userId)
 *  2. A Supabase access token (Bearer header) whose verified user matches
 * The response is never computed for an arbitrary third-party userId, which
 * prevents the profile (including SUPER_ADMIN status) from being enumerated.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const emailParam = searchParams.get('email')?.toLowerCase();

    const sessionCookie = getSessionFromRequest(request);
    if (sessionCookie && sessionCookie.userId === userId) {
      const profile = await resolveProfile(userId, emailParam);
      return NextResponse.json(profile);
    }

    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (bearer) {
      const { data, error } = await supabase.auth.getUser(bearer);
      if (!error && data.user && data.user.id === userId) {
        const profile = await resolveProfile(userId, emailParam);
        return NextResponse.json(profile);
      }
    }

    return NextResponse.json(
      { error: 'You are not authorized to view this profile' },
      { status: 401 }
    );
  } catch (error) {
    console.error('API session error:', error);
    return NextResponse.json({ error: error instanceof Error ? (error.message || 'Database lookup failure') : String(error) }, { status: 500 });
  }
}