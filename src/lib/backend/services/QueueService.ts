import { QueueRepository } from '../repositories/QueueRepository';
import { ClinicRepository } from '../repositories/ClinicRepository';
import { Validator } from '../validators/schemas';
import { prisma } from '@/lib/prisma';
import { AppError } from '../errors/AppError';
import { TokenStatus } from '@prisma/client';

export const QueueService = {
  async getTokens(clinicId: string, statusList?: TokenStatus[]) {
    if (!clinicId) {
      throw new AppError('Clinic ID is required', 400);
    }
    return await QueueRepository.getTokens(clinicId, statusList);
  },

  async joinQueue(payload: unknown) {
    const input = Validator.joinQueue(payload);

    // 1. Fetch clinic configurations
    const settings = await ClinicRepository.getSettings(input.clinicId);
    if (settings) {
      if (!settings.queueEnabled) {
        throw new AppError('Online queue system is currently disabled for this clinic', 400);
      }
      if (!input.isEmergency && !settings.walkInPatients) {
        throw new AppError('Walk-in check-in is disabled at this hour', 400);
      }
    }

    // 2. Validate current queue capacity limits
    const activeTokens = await QueueRepository.getTokens(input.clinicId, ['WAITING', 'CALLED', 'IN_CONSULTATION']);
    const maxCapacity = settings?.maxQueueSize || 50;
    if (activeTokens.length >= maxCapacity) {
      throw new AppError(`Queue is at maximum capacity (${maxCapacity} patients limit). Please try again later.`, 400);
    }

    // 3. Find or create patient record
    let patient = await prisma.patient.findFirst({
      where: { phone: input.patientPhone }
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: input.patientName,
          phone: input.patientPhone,
          clinicId: input.clinicId,
          age: input.age,
          gender: input.gender,
          email: `${input.patientName.toLowerCase().replace(/[^a-z0-9]/g, '')}@temp-patient.com`
        }
      });
    }

    // 4. Generate next token number
    const prefix = settings?.tokenPrefix || 'T';
    const latestToken = await QueueRepository.getLatestTokenForDoctor(input.clinicId, input.doctorId);
    let nextNum = 1;
    if (latestToken) {
      const match = latestToken.tokenNumber.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0]) + 1;
      }
    }
    const tokenNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    // 5. Calculate estimated wait time
    const avgConsultTime = settings?.slotDuration || 12;
    const estimatedWait = activeTokens.filter(t => t.doctorId === input.doctorId).length * avgConsultTime;

    // 6. Create token entry
    const token = await QueueRepository.createToken({
      clinicId: input.clinicId,
      doctorId: input.doctorId,
      patientId: patient.id,
      tokenNumber,
      priority: input.isEmergency ? 100 : (input.priority || 0),
      isEmergency: !!input.isEmergency,
      estimatedWait,
      reason: input.reason || ''
    });

    return token;
  },

  async updateTokenStatus(tokenId: string, status: TokenStatus) {
    if (!tokenId) {
      throw new AppError('Token ID is required', 400);
    }

    const payload: { calledAt?: Date; startedAt?: Date; completedAt?: Date } = {};
    if (status === 'CALLED') {
      payload.calledAt = new Date();
    } else if (status === 'IN_CONSULTATION') {
      payload.startedAt = new Date();
    } else if (status === 'COMPLETED') {
      payload.completedAt = new Date();
    }

    return await QueueRepository.updateTokenStatus(tokenId, status, payload);
  }
};
