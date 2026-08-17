export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required';
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 phone format check
  if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
    return 'Please enter a valid phone number (e.g. +1 555-123-4567)';
  }
  return null;
};

export const validatePincode = (pincode: string): string | null => {
  if (!pincode) return 'Pincode/ZIP code is required';
  if (pincode.length < 4 || pincode.length > 10) return 'Invalid pincode format';
  return null;
};
