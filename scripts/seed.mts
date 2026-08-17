import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and fill in your values.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Platform settings (the single row the super admin dashboard manages).
    const existing = await prisma.platformSettings.findFirst();
    if (existing) {
      await prisma.platformSettings.update({
        where: { id: existing.id },
        data: {
          platformName: 'Q-Clinix Platform',
          brandingColor: '#3b82f6',
          supportEmail: 'admin@qclinix.com',
          supportPhone: '+1-800-555-0199',
          maintenance: false,
        },
      });
      console.log('Platform settings already present — updated to defaults.');
    } else {
      await prisma.platformSettings.create({
        data: {
          platformName: 'Q-Clinix Platform',
          brandingColor: '#3b82f6',
          supportEmail: 'admin@qclinix.com',
          supportPhone: '+1-800-555-0199',
          maintenance: false,
        },
      });
      console.log('Platform settings seeded.');
    }

    // 2. Default feature flags (idempotent).
    const defaultFlags = [
      { name: 'Queue', isEnabled: true, description: 'Live waitlist queue engine' },
      { name: 'Appointments', isEnabled: true, description: 'Pre-scheduled booking slots' },
      { name: 'SMS Alerts', isEnabled: false, description: 'Text message token notifications' },
      { name: 'WhatsApp', isEnabled: false, description: 'WhatsApp queue position alerts' },
      { name: 'AI Assistant', isEnabled: true, description: 'AI consult duration wait time calibrator' },
      { name: 'QR Check-In', isEnabled: true, description: 'Self check-in QR codes' },
      { name: 'Telemedicine', isEnabled: false, description: 'Virtual consults video dashboard' },
    ];
    for (const flag of defaultFlags) {
      await prisma.featureFlag.upsert({
        where: { name: flag.name },
        update: {},
        create: flag,
      });
    }
    console.log(`Feature flags ensured (${defaultFlags.length} total).`);

    // 3. Super admin is designated by the SUPER_ADMIN_EMAIL env var (no app DB
    // row is needed — resolveProfile/sync grant SUPER_ADMIN to that email).
    // A real Supabase Auth account is created so the super admin can actually
    // sign in with email + password.
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || '';
    if (!superAdminEmail) {
      console.error(
        'SUPER_ADMIN_EMAIL is not set. Add it to .env (e.g. SUPER_ADMIN_EMAIL="admin@example.com") ' +
          'so the platform has a designated super admin. The account matching this email ' +
          'will be granted SUPER_ADMIN privileges on login.'
      );
      process.exit(1);
    }
    if (superAdminPassword.length < 6) {
      console.error(
        'SUPER_ADMIN_PASSWORD must be set (min 6 characters) so the super admin can sign in.'
      );
      process.exit(1);
    }
    console.log(`Super admin designated by email: ${superAdminEmail}`);

    const existingAuth = await pool.query(
      'select id from auth.users where lower(email) = $1',
      [superAdminEmail]
    );
    if (existingAuth.rowCount === 0) {
      const userId = randomUUID();
      await pool.query(
        `insert into auth.users
           (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
            is_sso_user, is_anonymous, email_change_confirm_status,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            email_change_token_current, reauthentication_token)
         values
           ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2,
            crypt($3, gen_salt('bf')), now(), now(), now(), $4::jsonb, $5::jsonb,
            false, false, 0, '', '', '', '', '', '')`,
        [
          userId,
          superAdminEmail,
          superAdminPassword,
          JSON.stringify({ provider: 'email', providers: ['email'] }),
          JSON.stringify({
            sub: userId,
            email: superAdminEmail,
            name: 'Super Admin',
            email_verified: true,
            phone_verified: false,
          }),
        ]
      );
      await pool.query(
        `insert into auth.identities
           (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
         values
           ($1, $1, $2, $3::jsonb, 'email', now(), now(), now())`,
        [userId, userId, JSON.stringify({ sub: userId, email: superAdminEmail, email_verified: true, phone_verified: false })]
      );
      console.log(`Created Supabase Auth user for super admin (${superAdminEmail}).`);
    } else {
      console.log(`Supabase Auth user already exists for ${superAdminEmail} — skipped.`);
    }

    console.log('Seed complete.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
