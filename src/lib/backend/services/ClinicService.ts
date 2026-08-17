import { ClinicRepository, ClinicSettingsInput } from '../repositories/ClinicRepository';
import { CacheService } from './CacheService';
import { AppError } from '../errors/AppError';

export const ClinicService = {
  async getSettings(clinicId: string) {
    if (!clinicId) {
      throw new AppError('Clinic ID is required', 400);
    }
    return await ClinicRepository.getSettings(clinicId);
  },

  async updateSettings(clinicId: string, payload: ClinicSettingsInput) {
    if (!clinicId) {
      throw new AppError('Clinic ID is required', 400);
    }
    const result = await ClinicRepository.upsertSettings(clinicId, payload);
    // Invalidate caches
    CacheService.invalidate(`clinic_details_${clinicId}`);
    return result;
  },

  async getClinicDetails(clinicId: string) {
    if (!clinicId) {
      throw new AppError('Clinic ID is required', 400);
    }

    const cacheKey = `clinic_details_${clinicId}`;
    const cached = CacheService.get<Awaited<ReturnType<typeof ClinicRepository.getClinicDetails>>>(cacheKey);
    if (cached) return cached;

    const details = await ClinicRepository.getClinicDetails(clinicId);
    if (!details) {
      throw new AppError('Clinic center not found', 404);
    }

    // Cache details for 60 seconds
    CacheService.set(cacheKey, details, 60000);
    return details;
  }
};
