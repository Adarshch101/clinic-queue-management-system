import { prisma } from '@/lib/prisma';
import { TokenStatus } from '@prisma/client';

export const QueueRepository = {
  async getTokens(clinicId: string, statusList?: TokenStatus[]) {
    return await prisma.queueToken.findMany({
      where: {
        clinicId,
        ...(statusList ? { status: { in: statusList } } : {})
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    });
  },

  async createToken(data: {
    clinicId: string;
    doctorId: string;
    patientId: string;
    tokenNumber: string;
    priority: number;
    isEmergency: boolean;
    estimatedWait: number;
    reason: string;
  }) {
    return await prisma.queueToken.create({
      data: {
        clinicId: data.clinicId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        tokenNumber: data.tokenNumber,
        priority: data.priority,
        isEmergency: data.isEmergency,
        estimatedWait: data.estimatedWait,
        reason: data.reason,
        status: 'WAITING'
      }
    });
  },

  async updateTokenStatus(tokenId: string, status: TokenStatus, datesPayload?: {
    calledAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
  }) {
    return await prisma.queueToken.update({
      where: { id: tokenId },
      data: {
        status,
        ...datesPayload
      }
    });
  },

  async getLatestTokenForDoctor(clinicId: string, doctorId: string) {
    return await prisma.queueToken.findFirst({
      where: { clinicId, doctorId },
      orderBy: { createdAt: 'desc' }
    });
  }
};
