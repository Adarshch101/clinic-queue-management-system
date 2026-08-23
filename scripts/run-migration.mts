import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set in environment variables.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const sqlPath = path.join(process.cwd(), 'profiles_schema.sql');
    console.log(`Reading SQL migration from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration on Supabase PostgreSQL database...');
    await pool.query(sql);
    console.log('Migration ran successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Unexpected migration execution error:', err);
  process.exit(1);
});
