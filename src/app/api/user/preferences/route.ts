import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/backend/errors/errorHandler';
import { UserService } from '@/lib/backend/services/UserService';
import { requireAuth } from '@/lib/apiAuth';

export const GET = withErrorHandler(async (request: Request) => {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const pref = await UserService.getPreferences(auth.session.userId);

  return NextResponse.json({
    success: true,
    data: pref,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

export const POST = withErrorHandler(async (request: Request) => {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  body.userId = auth.session.userId;

  const pref = await UserService.updatePreferences(body);

  return NextResponse.json({
    success: true,
    data: pref,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});
