import { prisma } from './prisma';
import { mkdir, writeFile, stat } from 'fs/promises';
import path from 'path';
import { format } from 'util';

// Backups are written OUTSIDE public/ so the raw SQL dumps (which contain
// PHI, auth userIds and audit logs) can never be fetched by URL. They are
// downloaded only through the SUPER_ADMIN-gated endpoint. The path is
// statically scoped to <cwd>/data/backups so Turbopack does not trace the
// whole project.
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

// Tables that make up a complete database dump
const TABLES = [
  'clinic',
  'clinicProfile',
  'clinicSettings',
  'clinicDocument',
  'clinicAdmin',
  'doctor',
  'receptionist',
  'patient',
  'appointment',
  'queueToken',
  'visit',
  'medicalReport',
  'notification',
  'auditLog',
  'verificationRequest',
  'verificationHistory',
  'queueEvent',
  'queueTransferHistory',
  'workingHours',
  'holiday',
  'subscription',
  'report',
  'widgetPreference',
  'userPreference',
  'notificationPreference',
  'notificationTemplate',
  'analyticsEvent',
  'analyticsSummary',
  'deliveryLog',
  'backupJob',
] as const;

type PrismaModel = {
  findMany: () => Promise<Array<Record<string, unknown>>>;
};

function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return String(value);
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

/**
 * Generates a real SQL dump of every table and writes it to a private
 * directory outside public/. Returns a SUPER_ADMIN-gated download URL.
 */
export async function createDatabaseBackup(): Promise<{ filename: string; fileUrl: string; size: number }> {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const filename = `db_dump_${timestamp}.sql`;
  const fileUrl = `/api/super-admin/backup/download?file=${encodeURIComponent(filename)}`;

  const lines: string[] = [];
  lines.push('-- Q-Clinix database dump');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const table of TABLES) {
    const model = ((prisma as unknown) as Record<string, unknown>)[table] as PrismaModel | undefined;
    if (!model || typeof model.findMany !== 'function') continue;

    const rows = await model.findMany();

    lines.push(`-- Table: ${table} (${rows.length} rows)`);
    if (rows.length > 0) {
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((col) => escapeSqlValue(row[col]));
        lines.push(
          `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`
        );
      }
    }
    lines.push('');
  }

  const content = lines.join('\n');
  await mkdir(BACKUP_DIR, { recursive: true });
  await writeFile(path.join(BACKUP_DIR, filename), content, 'utf8');

  return {
    filename,
    fileUrl,
    size: Buffer.byteLength(content, 'utf8'),
  };
}

export function humanReadableSize(bytes: number): string {
  return format(
    bytes > 1024 * 1024
      ? '%s MB'
      : bytes > 1024
        ? '%s KB'
        : '%s B',
    (bytes / (bytes > 1024 * 1024 ? 1024 * 1024 : bytes > 1024 ? 1024 : 1)).toFixed(2)
  );
}

/**
 * Resolves a backup filename to an absolute path inside the private backup
 * directory. Returns null when the name is empty, escapes the directory
 * (path traversal), or points at a file that does not exist.
 */
export async function resolveBackupFilePath(filename: string): Promise<string | null> {
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null;
  }

  const absPath = path.join(BACKUP_DIR, filename);
  try {
    const s = await stat(absPath);
    if (!s.isFile()) return null;
    return absPath;
  } catch {
    return null;
  }
}