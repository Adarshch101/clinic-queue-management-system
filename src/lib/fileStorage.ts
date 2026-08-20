import { mkdir, writeFile, stat, unlink, readFile } from 'fs/promises';
import path from 'path';
import { UTApi } from 'uploadthing/server';

// File bytes (medical reports, verification documents) are stored with
// UploadThing and kept PRIVATE (never publicly fetchable by URL). They are
// served only through authenticated endpoints that re-check role and clinic
// access, streaming the bytes back via short-lived signed URLs.
//
// When no UPLOADTHING_TOKEN is configured the module falls back to the private
// local directory (data/uploads, outside public/) so the app still runs in
// development. Production must set UPLOADTHING_TOKEN.
const DATA_DIR = path.join(process.cwd(), 'data', 'uploads');

export const ALLOWED_UPLOAD_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const uploadStorage = process.env.UPLOADTHING_TOKEN ? 'uploadthing' : 'local';

let _utapi: UTApi | null = null;
function getUtapi(): UTApi {
  if (!_utapi) {
    _utapi = new UTApi();
  }
  return _utapi;
}

// UploadThing ACL for stored files. Defaults to `private`; free-tier apps that
// do not allow private files must set UPLOADTHING_ACL=public-read. Either way
// the raw CDN URL is never returned to clients — files are served only through
// authenticated /api/files/* endpoints using short-lived signed URLs.
export const uploadAcl = process.env.UPLOADTHING_ACL === 'public-read' ? 'public-read' : 'private';

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
 * Normalizes a stored local key and resolves it to an absolute path inside the
 * private upload directory. Returns null for empty/malicious (path-traversal)
 * keys or when the file does not exist. Only used in local fallback mode.
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
 * Saves an uploaded File to UploadThing (using the configured ACL) or, in local
 * fallback mode, to the private upload directory. Returns the storage key and
 * the real byte size. Rejects disallowed extensions and files larger than
 * MAX_UPLOAD_BYTES.
 */
export async function saveUploadFile(
  dir: 'reports' | 'documents',
  file: File
): Promise<{ fileKey: string; size: number }> {
  const validationError = validateUploadFile(file);
  if (validationError) throw new Error(validationError);

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File must be at most ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`);
  }

  if (uploadStorage === 'uploadthing') {
    const uploadInput = new File([bytes], file.name, { type: file.type || 'application/octet-stream' });
    const res = await getUtapi().uploadFiles(uploadInput, {
      acl: uploadAcl,
      contentDisposition: 'inline',
    });
    const uploaded = res.data;
    if (!uploaded?.key) {
      throw new Error('UploadThing upload failed');
    }
    // Best-effort: enforce the private ACL even if per-request overrides are
    // disabled in the app settings. Skipped when configured for public-read
    // (e.g. free-tier apps that do not allow private files). Failures are
    // ignored (the app-level default applies instead).
    if (uploadAcl === 'private') {
      try {
        await getUtapi().updateACL(uploaded.key, 'private');
      } catch {
        // app-level ACL applies
      }
    }
    return { fileKey: uploaded.key, size: uploaded.size ?? bytes.length };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${safeName}`;
  const absDir = path.join(DATA_DIR, dir);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, fileName), bytes);

  return { fileKey: `${dir}/${fileName}`, size: bytes.length };
}

/**
 * Returns the size in bytes of a stored upload, or null if unknown.
 * In UploadThing mode the size is captured at upload time but is not
 * persisted in the DB, so listings report it as unknown.
 */
export async function getUploadFileSize(fileKey: string): Promise<number | null> {
  if (uploadStorage === 'uploadthing') return null;
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
 * Reads a stored upload's bytes back for authorized serving. Returns null if
 * the file is missing or cannot be retrieved. In UploadThing mode this signs a
 * short-lived URL and streams the bytes through the server so the CDN URL is
 * never exposed to the client.
 */
export async function readUploadFile(
  fileKey: string
): Promise<{ content: ArrayBuffer } | null> {
  if (!fileKey) return null;

  if (uploadStorage === 'uploadthing') {
    try {
      const signed = await getUtapi().getSignedURL(fileKey, { expiresIn: '15 minutes' });
      const signedUrl = signed.url ?? signed.ufsUrl;
      if (!signedUrl) return null;
      const response = await fetch(signedUrl);
      if (!response.ok) return null;
      return { content: await response.arrayBuffer() };
    } catch {
      return null;
    }
  }

  const abs = await resolveUploadPath(fileKey);
  if (!abs) return null;
  try {
    const buf = await readFile(abs);
    return {
      content: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
    };
  } catch {
    return null;
  }
}

/**
 * Deletes a stored upload by its file key. Silently ignores missing files.
 */
export async function deleteUploadFile(fileKey: string): Promise<void> {
  if (!fileKey) return;
  if (uploadStorage === 'uploadthing') {
    try {
      await getUtapi().deleteFiles(fileKey);
    } catch {
      // File may already be gone — nothing to do
    }
    return;
  }
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