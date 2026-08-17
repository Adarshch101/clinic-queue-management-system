import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { resolveProfile } from '@/lib/resolveProfile';
import { createSessionToken } from '@/lib/session';
import { RateLimiter } from '@/lib/backend/middleware/rateLimiter';

export async function POST(request: Request) {
  try {
    // Rate limit session establishment to 20 attempts per IP per 15 minutes
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    try {
      RateLimiter.checkLimit(`rate_session_${clientIp}`, 20, 15 * 60 * 1000);
    } catch {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing accessToken' }, { status: 400 });
    }

    // Verify the Supabase access token server-side. The anon key is sufficient
    // for Supabase to validate the JWT and return the user.
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
    }

    const profile = await resolveProfile(user.id, user.email || undefined);

    const sessionToken = createSessionToken({
      userId: user.id,
      role: profile.role,
      clinicId: profile.clinicId,
      clinicStatus: profile.clinicStatus,
    });

    const response = NextResponse.json({ success: true, profile });
    response.cookies.set('q-clinix-session', sessionToken, {
      path: '/',
      maxAge: 86400, // 24 hours
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('API set-session error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}