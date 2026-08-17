import { prisma } from '@/lib/prisma';

export interface ClinicSettingsInput {
  queueEnabled?: boolean;
  appointmentsEnabled?: boolean;
  walkInPatients?: boolean;
  emergencyQueue?: boolean;
  tokenPrefix?: string;
  maxDailyTokens?: number;
  onlineQueueVisibility?: boolean;
  publicProfileVisibility?: boolean;
  notificationPreferences?: string;
  timezone?: string;
  language?: string;
  maxQueueSize?: number;
  slotDuration?: number;
}

export const ClinicRepository = {
  async getSettings(clinicId: string) {
    return await prisma.clinicSettings.findUnique({
      where: { clinicId }
    });
  },

  async upsertSettings(clinicId: string, data: ClinicSettingsInput) {
    return await prisma.clinicSettings.upsert({
      where: { clinicId },
      update: data,
      create: {
        clinicId,
        ...data
      }
    });
  },

  async getClinicDetails(clinicId: string) {
    return await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        profile: true,
        settings: true
      }
    });
  }
};
