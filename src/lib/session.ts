import { createHmac, timingSafeEqual } from 'crypto';

export interface SessionPayload {
  userId: string;
  role: string;
  clinicId?: string;
  clinicStatus?: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const DEV_SECRET = 'dev-insecure-session-secret-change-me';

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    return DEV_SECRET;
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

/**
 * Creates a signed session token: base64url(JSON).base64url(HMAC-SHA256).
 * The HMAC signature prevents clients from forging or tampering with the session.
 */
export function createSessionToken(data: Omit<SessionPayload, 'expiresAt'>): string {
  const payload: SessionPayload = { ...data, expiresAt: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

/**
 * Verifies the signature and expiry of a session token.
 * Returns the payload on success, or null if the token is invalid, tampered, or expired.
 */
export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = sign(body);
  const received = Buffer.from(sig, 'base64url');
  const computed = Buffer.from(expected, 'base64url');

  if (received.length !== computed.length || !timingSafeEqual(received, computed)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.userId || !parsed.role) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the session token from a request's cookies.
 */
export function getSessionFromRequest(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('q-clinix-session='));
  if (!match) return null;
  return verifySessionToken(match.slice('q-clinix-session='.length));
}