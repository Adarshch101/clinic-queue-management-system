interface OnboardingStepDoctor {
  name?: string;
  specialization?: string;
  registrationNumber?: string;
}

interface OnboardingStepDocument {
  documentType?: string;
}

interface OnboardingStepData {
  clinicName?: string;
  legalBusinessName?: string;
  clinicType?: string;
  establishedYear?: number;
  primaryEmail?: string;
  primaryPhone?: string;
  country?: string;
  state?: string;
  city?: string;
  addressLine1?: string;
  pincode?: string;
  doctors?: OnboardingStepDoctor[];
  services?: string;
  workingDays?: string[];
  documents?: OnboardingStepDocument[];
  tokenPrefix?: string;
  timezone?: string;
}

export const validateOnboardingStep = (step: number, data: OnboardingStepData): string[] => {
  const errors: string[] = [];

  switch (step) {
    case 1: // Basic Information
      if (!data.clinicName?.trim()) errors.push('Clinic Name is required.');
      if (!data.legalBusinessName?.trim()) errors.push('Legal Business Name is required.');
      if (!data.clinicType) errors.push('Clinic Type must be selected.');
      if (data.establishedYear && (data.establishedYear < 1800 || data.establishedYear > new Date().getFullYear())) {
        errors.push('Please enter a valid established year.');
      }
      break;

    case 2: // Contact Details
      if (!data.primaryEmail?.trim()) {
        errors.push('Primary Email is required.');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.primaryEmail)) {
        errors.push('Please enter a valid primary email.');
      }
      if (!data.primaryPhone?.trim()) {
        errors.push('Primary Phone is required.');
      } else if (!/^\+?[1-9]\d{1,14}$/.test(data.primaryPhone.replace(/[\s-()]/g, ''))) {
        errors.push('Please enter a valid primary phone number.');
      }
      break;

    case 3: // Address
      if (!data.country?.trim()) errors.push('Country is required.');
      if (!data.state?.trim()) errors.push('State is required.');
      if (!data.city?.trim()) errors.push('City is required.');
      if (!data.addressLine1?.trim()) errors.push('Address Line 1 is required.');
      if (!data.pincode?.trim()) {
        errors.push('Pincode is required.');
      } else if (data.pincode.length < 4 || data.pincode.length > 10) {
        errors.push('Please enter a valid pincode.');
      }
      break;

    case 4: // Doctor Information
      if (!data.doctors || data.doctors.length === 0) {
        errors.push('At least one doctor must be added.');
      } else {
        data.doctors.forEach((doc, index: number) => {
          if (!doc.name?.trim()) errors.push(`Doctor #${index + 1}: Name is required.`);
          if (!doc.specialization?.trim()) errors.push(`Doctor #${index + 1}: Specialization is required.`);
          if (!doc.registrationNumber?.trim()) errors.push(`Doctor #${index + 1}: License Registration Number is required.`);
        });
      }
      break;

    case 5: // Services
      if (!data.services || data.services.trim() === '') {
        errors.push('Please select or specify at least one offered service.');
      }
      break;

    case 6: // Working Hours
      // Check that closing time is after opening time
      if (!data.workingDays || data.workingDays.length === 0) {
        errors.push('Operational hours must select at least one working day.');
      }
      break;

    case 7: // Documents
      if (!data.documents || data.documents.length === 0) {
        errors.push('Verification documents must be uploaded.');
      } else {
        const hasLicense = data.documents.some((d) => d.documentType === 'MEDICAL_LICENSE');
        const hasClinicReg = data.documents.some((d) => d.documentType === 'CLINIC_REGISTRATION');
        if (!hasLicense) errors.push('Medical License document is required.');
        if (!hasClinicReg) errors.push('Clinic Registration Certificate is required.');
      }
      break;

    case 8: // Settings
      if (!data.tokenPrefix?.trim()) errors.push('Token prefix prefix is required.');
      if (!data.timezone) errors.push('Timezone config is required.');
      break;

    default:
      break;
  }

  return errors;
};
