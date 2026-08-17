import { prisma } from './prisma';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { format } from 'util';

const BACKUP_DIR = path.join(process.cwd(), 'public', 'uploads', 'backups');

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
 * Generates a real SQL dump of every table and writes it to
 * public/uploads/backups. Returns the real byte size of the file.
 */
export async function createDatabaseBackup(): Promise<{ filename: string; fileUrl: string; size: number }> {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const filename = `db_dump_${timestamp}.sql`;
  const fileUrl = `/uploads/backups/${filename}`;

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