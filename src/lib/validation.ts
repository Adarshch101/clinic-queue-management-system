import { validateEmail, validatePhone } from '@/features/auth/validators/authValidators';

export { validateEmail, validatePhone };

export const validateRequired = (value: string, label = 'This field'): string | null => {
  if (!value || !value.trim()) return `${label} is required`;
  return null;
};

export const validateName = (value: string, label = 'Name'): string | null => {
  const required = validateRequired(value, label);
  if (required) return required;
  if (value.trim().length < 2) return `${label} must be at least 2 characters`;
  if (value.trim().length > 100) return `${label} must be at most 100 characters`;
  return null;
};

export const validateAge = (value: string): string | null => {
  const required = validateRequired(value, 'Age');
  if (required) return required;
  const age = Number(value);
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return 'Please enter a valid age between 0 and 120';
  }
  return null;
};

export const validateReason = (value: string, label = 'Reason'): string | null => {
  const required = validateRequired(value, label);
  if (required) return required;
  if (value.trim().length > 500) return `${label} must be at most 500 characters`;
  return null;
};

export const validateFile = (
  file: File | null,
  allowedExtensions: string[] = ['pdf', 'png', 'jpg', 'jpeg', 'webp'],
  maxBytes = 10 * 1024 * 1024
): string | null => {
  if (!file) return 'A file is required';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    return `Unsupported file type ".${ext}". Allowed: ${allowedExtensions.join(', ')}`;
  }
  if (file.size > maxBytes) {
    return `File must be at most ${Math.round(maxBytes / 1024 / 1024)} MB`;
  }
  return null;
};

export const validateDateTime = (value: string): string | null => {
  const required = validateRequired(value, 'Date and time');
  if (required) return required;
  if (Number.isNaN(new Date(value).getTime())) {
    return 'Please enter a valid date and time';
  }
  return null;
};

export interface ValidationErrors {
  [field: string]: string | null;
}

export const hasErrors = (errors: ValidationErrors): boolean =>
  Object.values(errors).some((error) => error !== null);