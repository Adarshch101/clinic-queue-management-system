import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';

export async function GET(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;

  try {
    // 1. Fetch Platform Settings (fallback if none exists)
    let settings = await prisma.platformSettings.findFirst();
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          platformName: 'Q-Clinix',
          brandingColor: '#3b82f6',
          supportEmail: 'support@qclinix.com',
          supportPhone: '+1-800-555-0199',
          timezone: 'UTC',
          maintenance: false,
        }
      });
    }

    // 2. Fetch Feature Flags
    const flags = await prisma.featureFlag.findMany();

    // 3. Fetch Integration Configs
    const integrations = await prisma.integrationConfig.findMany();

    // 4. Fetch obfuscated API Keys
    const rawKeys = await prisma.apiKey.findMany();
    const keys = rawKeys.map(k => ({
      id: k.id,
      name: k.name,
      value: k.value.length > 8 ? `${k.value.slice(0, 4)}••••••••${k.value.slice(-4)}` : '••••••••',
      updatedAt: k.updatedAt
    }));

    // 5. Fetch Configuration change ledger
    const history = await prisma.configurationHistory.findMany({
      orderBy: { changedAt: 'desc' },
      take: 15
    });

    // 6. Fetch backup jobs
    const backups = await prisma.backupJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // System details metadata
    const systemInfo = {
      version: '1.0.4-SaaS',
      dbEngine: 'PostgreSQL 15',
      environment: process.env.NODE_ENV || 'development',
      buildNumber: '915-PROD',
      lastDeploy: '2026-07-24'
    };

    return NextResponse.json({
      settings,
      flags,
      integrations,
      keys,
      history,
      backups,
      systemInfo
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const { action, settingsId, payload } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const userId = session.userId;

    // Action 1: Save General settings
    if (action === 'save-general') {
      const current = await prisma.platformSettings.findUnique({
        where: { id: settingsId }
      });

      const updated = await prisma.platformSettings.update({
        where: { id: settingsId },
        data: {
          platformName: payload.platformName,
          brandingColor: payload.brandingColor,
          supportEmail: payload.supportEmail,
          supportPhone: payload.supportPhone,
          timezone: payload.timezone,
        }
      });

      // Log configuration history audit
      if (current) {
        const changes = [];
        if (current.platformName !== payload.platformName) changes.push(`platformName: ${current.platformName} -> ${payload.platformName}`);
        if (current.brandingColor !== payload.brandingColor) changes.push(`brandingColor: ${current.brandingColor} -> ${payload.brandingColor}`);
        
        if (changes.length > 0) {
          await prisma.configurationHistory.create({
            data: {
              settingKey: 'PLATFORM_SETTINGS',
              oldValue: JSON.stringify(current),
              newValue: JSON.stringify(updated),
              changedBy: userId,
              reason: changes.join(', '),
            }
          });
        }
      }

      return NextResponse.json(updated);
    }

    // Action 2: Update feature flag
    if (action === 'update-flag') {
      const { flagId, isEnabled } = payload;
      const current = await prisma.featureFlag.findUnique({ where: { id: flagId } });
      const updated = await prisma.featureFlag.update({
        where: { id: flagId },
        data: { isEnabled }
      });

      await prisma.configurationHistory.create({
        data: {
          settingKey: `FEATURE_FLAG_${updated.name}`,
          oldValue: current?.isEnabled ? 'true' : 'false',
          newValue: isEnabled ? 'true' : 'false',
          changedBy: userId,
          reason: `Feature flag ${updated.name} updated.`,
        }
      });

      return NextResponse.json(updated);
    }

    // Action 3: Save API key token
    if (action === 'save-key') {
      const { name, value } = payload;
      const current = await prisma.apiKey.findUnique({ where: { name } });
      await prisma.apiKey.upsert({
        where: { name },
        update: { value },
        create: { name, value }
      });

      await prisma.configurationHistory.create({
        data: {
          settingKey: `API_KEY_${name}`,
          oldValue: current ? '••••••••' : 'None',
          newValue: '••••••••',
          changedBy: userId,
          reason: `API Key token value for ${name} configured/updated.`,
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
