import { prisma } from '@/lib/prisma';

export const UserRepository = {
  async getPreferences(userId: string) {
    return await prisma.userPreference.findUnique({
      where: { userId }
    });
  },

  async upsertPreferences(userId: string, data: {
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    accessibility: boolean;
  }) {
    return await prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });
  }
};
