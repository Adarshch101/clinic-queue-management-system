import { mkdir, writeFile, stat, unlink } from 'fs/promises';
import path from 'path';

// Uploads live OUTSIDE public/ so file bytes (medical reports, verification
// documents) can never be fetched by URL. They are served only through
// authenticated endpoints that re-check role and clinic access. The stored
// "key" is a relative path under this directory. The path is statically
// scoped so Turbopack does not trace the whole project.
const DATA_DIR = path.join(process.cwd(), 'data', 'uploads');

export const ALLOWED_UPLOAD_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateUploadFile(file: File | null): string | null {
  if (!file || !file.name) return 'A file is required';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
    return `Unsupported file type ".${ext}". Allowed: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File must be at most ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`;
  }
  return null;
}

/**
 * Normalizes a stored key and resolves it to an absolute path inside the
 * private upload directory. Returns null for empty/malicious (path-traversal)
 * keys or when the file does not exist. Legacy keys stored as "/uploads/…"
 * are normalized to the new location.
 */
export async function resolveUploadPath(fileKey: string): Promise<string | null> {
  if (!fileKey) return null;
  const normalized = fileKey.replace(/^\/uploads\//, '');
  if (
    !normalized ||
    normalized.includes('..') ||
    normalized.startsWith('/') ||
    normalized.includes('\\')
  ) {
    return null;
  }
  // The key must stay within DATA_DIR (single subdir + file name).
  const parts = normalized.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const abs = path.join(DATA_DIR, parts[0], parts[1]);
  try {
    const s = await stat(abs);
    if (!s.isFile()) return null;
    return abs;
  } catch {
    return null;
  }
}

/**
 * Saves an uploaded File to the private upload directory. Returns the
 * relative file key (e.g. "reports/<name>") and the real byte size.
 * Rejects disallowed extensions and files larger than MAX_UPLOAD_BYTES.
 */
export async function saveUploadFile(
  dir: 'reports' | 'documents',
  file: File
): Promise<{ fileKey: string; size: number }> {
  const validationError = validateUploadFile(file);
  if (validationError) throw new Error(validationError);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${safeName}`;
  const absDir = path.join(DATA_DIR, dir);
  await mkdir(absDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File must be at most ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`);
  }
  await writeFile(path.join(absDir, fileName), bytes);

  return { fileKey: `${dir}/${fileName}`, size: bytes.length };
}

/**
 * Returns the size in bytes of a stored upload, or null if missing.
 */
export async function getUploadFileSize(fileKey: string): Promise<number | null> {
  const abs = await resolveUploadPath(fileKey);
  if (!abs) return null;
  try {
    const s = await stat(abs);
    return s.size;
  } catch {
    return null;
  }
}

/**
 * Deletes a stored upload by its file key. Silently ignores missing files.
 */
export async function deleteUploadFile(fileKey: string): Promise<void> {
  const abs = await resolveUploadPath(fileKey);
  if (!abs) return;
  try {
    await unlink(abs);
  } catch {
    // File may already be gone — nothing to do
  }
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes < 0) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}