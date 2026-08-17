import { UserRepository } from '../repositories/UserRepository';
import { Validator } from '../validators/schemas';
import { AppError } from '../errors/AppError';

export const UserService = {
  async getPreferences(userId: string) {
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }
    
    let pref = await UserRepository.getPreferences(userId);
    if (!pref) {
      // Return defaults
      pref = await UserRepository.upsertPreferences(userId, {
        theme: 'light',
        language: 'en',
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
        accessibility: false
      });
    }
    return pref;
  },

  async updatePreferences(data: unknown) {
    const validated = Validator.savePreferences(data);
    return await UserRepository.upsertPreferences(validated.userId, {
      theme: validated.theme,
      language: validated.language,
      timeFormat: validated.timeFormat,
      dateFormat: validated.dateFormat,
      accessibility: validated.accessibility
    });
  }
};
