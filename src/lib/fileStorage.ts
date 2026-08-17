import { mkdir, writeFile, stat, unlink } from 'fs/promises';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Saves an uploaded File to the local filesystem under public/uploads/<dir>.
 * Returns the public URL and the real byte size.
 */
export async function saveUploadFile(
  dir: string,
  file: File
): Promise<{ fileUrl: string; size: number }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}_${safeName}`;
  const absDir = path.join(PUBLIC_DIR, 'uploads', dir);
  await mkdir(absDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(absDir, fileName), bytes);

  return { fileUrl: `/uploads/${dir}/${fileName}`, size: bytes.length };
}

/**
 * Returns the size in bytes of a stored upload, or null if missing.
 */
export async function getUploadFileSize(fileUrl: string): Promise<number | null> {
  try {
    const abs = path.join(PUBLIC_DIR, fileUrl.replace(/^\//, ''));
    const s = await stat(abs);
    return s.size;
  } catch {
    return null;
  }
}

/**
 * Deletes a stored upload by its public URL. Silently ignores missing files.
 */
export async function deleteUploadFile(fileUrl: string): Promise<void> {
  try {
    const abs = path.join(PUBLIC_DIR, fileUrl.replace(/^\//, ''));
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