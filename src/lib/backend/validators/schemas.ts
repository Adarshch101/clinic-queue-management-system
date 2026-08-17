import { AppError } from '../errors/AppError';

export interface JoinQueueInput {
  clinicId: string;
  doctorId: string;
  patientName: string;
  patientPhone: string;
  age: number;
  gender: string;
  reason?: string;
  priority?: number;
  isEmergency?: boolean;
}

export interface SavePreferencesInput {
  userId: string;
  theme: string;
  language: string;
  timeFormat: string;
  dateFormat: string;
  accessibility: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class Validator {
  static joinQueue(input: unknown): JoinQueueInput {
    const data = input as Record<string, unknown>;
    const errors: ValidationError[] = [];

    if (!data.clinicId) errors.push({ field: 'clinicId', message: 'Clinic ID is required' });
    if (!data.doctorId) errors.push({ field: 'doctorId', message: 'Doctor ID is required' });
    
    if (!data.patientName || (data.patientName as string).trim().length < 2) {
      errors.push({ field: 'patientName', message: 'Patient Name must be at least 2 characters long' });
    }

    if (!data.patientPhone || (data.patientPhone as string).trim().length < 8) {
      errors.push({ field: 'patientPhone', message: 'Patient Phone must be a valid contact number' });
    }

    if (errors.length > 0) {
      throw new AppError('Validation failed', 400, errors);
    }

    return {
      clinicId: data.clinicId as string,
      doctorId: data.doctorId as string,
      patientName: (data.patientName as string).trim(),
      patientPhone: (data.patientPhone as string).trim(),
      age: data.age ? parseInt(data.age as string) : 35,
      gender: (data.gender as string) || 'Male',
      reason: (data.reason as string) || '',
      priority: data.priority ? parseInt(data.priority as string) : 0,
      isEmergency: !!data.isEmergency
    };
  }

  static savePreferences(input: unknown): SavePreferencesInput {
    const data = input as Record<string, unknown>;
    const errors: ValidationError[] = [];

    if (!data.userId) errors.push({ field: 'userId', message: 'User ID is required' });
    if (!['light', 'dark'].includes(data.theme as string)) {
      errors.push({ field: 'theme', message: 'Invalid theme choice' });
    }
    if (!['12h', '24h'].includes(data.timeFormat as string)) {
      errors.push({ field: 'timeFormat', message: 'Invalid time format preference' });
    }

    if (errors.length > 0) {
      throw new AppError('Validation failed', 400, errors);
    }

    return {
      userId: data.userId as string,
      theme: data.theme as string,
      language: (data.language as string) || 'en',
      timeFormat: data.timeFormat as string,
      dateFormat: (data.dateFormat as string) || 'MM/DD/YYYY',
      accessibility: !!data.accessibility
    };
  }
}
