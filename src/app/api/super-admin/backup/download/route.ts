import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/apiAuth';
import { resolveBackupFilePath } from '@/lib/backupService';
import { readFile } from 'fs/promises';

export async function GET(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    // Resolve the filename against the private backup directory. This rejects
    // path-traversal attempts (../, absolute paths) and unknown files.
    const absPath = await resolveBackupFilePath(file);
    if (!absPath) {
      return NextResponse.json({ error: 'Invalid or missing backup file' }, { status: 404 });
    }

    const content = await readFile(absPath);

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file)}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    console.error('Backup download error:', error);
    return NextResponse.json({ error: 'Failed to read backup file' }, { status: 500 });
  }
}