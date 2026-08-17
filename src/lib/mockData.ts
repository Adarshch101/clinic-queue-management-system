export interface Clinic {
  id: string;
  name: string;
  subdomain: string;
  logo: string;
  primaryColor: string;
  address: string;
  phone: string;
  email: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialization: string;
  roomNumber: string;
  email: string;
  phone: string;
  avatar: string;
  workingHours: string;
  averageConsultationTime: number; // in minutes
  isActive?: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  dateTime: string; // ISO string
  reason: string;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW';
}

export interface QueueToken {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  tokenNumber: string; // e.g. "D1-01"
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED';
  isEmergency: boolean;
  priority: number;
  estimatedWait: number; // in minutes
  reason: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  appointmentId?: string | null;
}

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  fileName: string;
  fileType: 'pdf' | 'image';
  reportType: string; // e.g. Blood Test, X-Ray
  uploadedAt: string;
  size: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  channel: 'PUSH' | 'SMS' | 'WHATSAPP' | 'EMAIL';
}
