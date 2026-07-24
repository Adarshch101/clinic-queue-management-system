export interface Clinic {
  id: string;
  name: string;
  subdomain: string;
  logo: string;
  primaryColor: string;
  address: string;
  phone: string;
  email: string;
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

export const MOCK_CLINICS: Clinic[] = [
  {
    id: 'clinic-1',
    name: 'CareFirst Medical Center',
    subdomain: 'carefirst',
    logo: '🏥',
    primaryColor: '#2563eb', // Blue-600
    address: '742 Evergreen Terrace, Springfield',
    phone: '+1 (555) 123-4567',
    email: 'info@carefirst.com',
  },
  {
    id: 'clinic-2',
    name: 'Metro Wellness Clinic',
    subdomain: 'metrowellness',
    logo: '🌿',
    primaryColor: '#0d9488', // Teal-600
    address: '100 Medical Plaza, Suite 400, Metro City',
    phone: '+1 (555) 987-6543',
    email: 'support@metrowellness.com',
  },
];

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    clinicId: 'clinic-1',
    name: 'Dr. Sarah Jenkins',
    specialization: 'Cardiologist',
    roomNumber: 'Room 102',
    email: 's.jenkins@carefirst.com',
    phone: '+1 (555) 001-0022',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    workingHours: '09:00 AM - 05:00 PM',
    averageConsultationTime: 12,
  },
  {
    id: 'doc-2',
    clinicId: 'clinic-1',
    name: 'Dr. Robert Chen',
    specialization: 'Pediatrician',
    roomNumber: 'Room 105',
    email: 'r.chen@carefirst.com',
    phone: '+1 (555) 001-0033',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    workingHours: '08:30 AM - 04:30 PM',
    averageConsultationTime: 10,
  },
  {
    id: 'doc-3',
    clinicId: 'clinic-2',
    name: 'Dr. Elena Rostova',
    specialization: 'Dermatologist',
    roomNumber: 'Room 201',
    email: 'e.rostova@metrowell.com',
    phone: '+1 (555) 002-0044',
    avatar: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
    workingHours: '10:00 AM - 06:00 PM',
    averageConsultationTime: 15,
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  { id: 'pat-1', clinicId: 'clinic-1', name: 'Alex Harrison', email: 'alex.harrison@gmail.com', phone: '+1 (555) 111-2222', age: 34, gender: 'Male' },
  { id: 'pat-2', clinicId: 'clinic-1', name: 'Emily Watson', email: 'emily.watson@yahoo.com', phone: '+1 (555) 222-3333', age: 29, gender: 'Female' },
  { id: 'pat-3', clinicId: 'clinic-1', name: 'James Carter', email: 'james.carter@outlook.com', phone: '+1 (555) 333-4444', age: 52, gender: 'Male' },
  { id: 'pat-4', clinicId: 'clinic-1', name: 'Sophia Martinez', email: 'sophia.m@gmail.com', phone: '+1 (555) 444-5555', age: 8, gender: 'Female' },
  { id: 'pat-5', clinicId: 'clinic-1', name: 'David Kim', email: 'david.kim@naver.com', phone: '+1 (555) 555-6666', age: 41, gender: 'Male' },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    clinicId: 'clinic-1',
    patientId: 'pat-1',
    patientName: 'Alex Harrison',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    dateTime: '2026-07-24T18:00:00.000Z',
    reason: 'Routine cardiovascular check-up and prescription refill',
    status: 'SCHEDULED',
  },
  {
    id: 'appt-2',
    clinicId: 'clinic-1',
    patientId: 'pat-2',
    patientName: 'Emily Watson',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    dateTime: '2026-07-24T18:30:00.000Z',
    reason: 'Mild chest tightness during exercise',
    status: 'SCHEDULED',
  },
  {
    id: 'appt-3',
    clinicId: 'clinic-1',
    patientId: 'pat-3',
    patientName: 'James Carter',
    doctorId: 'doc-2',
    doctorName: 'Dr. Robert Chen',
    dateTime: '2026-07-24T19:00:00.000Z',
    reason: 'Consultation about child behavior changes',
    status: 'SCHEDULED',
  },
  {
    id: 'appt-4',
    clinicId: 'clinic-1',
    patientId: 'pat-4',
    patientName: 'Sophia Martinez',
    doctorId: 'doc-2',
    doctorName: 'Dr. Robert Chen',
    dateTime: '2026-07-24T17:30:00.000Z',
    reason: 'High fever and sore throat (Checked In)',
    status: 'CHECKED_IN',
  },
];

export const INITIAL_QUEUE_TOKENS: QueueToken[] = [
  {
    id: 'token-1',
    clinicId: 'clinic-1',
    patientId: 'pat-5',
    patientName: 'David Kim',
    patientAge: 41,
    patientGender: 'Male',
    doctorId: 'doc-1',
    tokenNumber: 'SJ-041',
    status: 'IN_CONSULTATION',
    isEmergency: false,
    priority: 0,
    estimatedWait: 0,
    reason: 'Pre-surgery consultation follow-up',
    startedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(), // started 6 mins ago
  },
  {
    id: 'token-2',
    clinicId: 'clinic-1',
    patientId: 'pat-4',
    patientName: 'Sophia Martinez',
    patientAge: 8,
    patientGender: 'Female',
    doctorId: 'doc-2',
    tokenNumber: 'RC-012',
    status: 'IN_CONSULTATION',
    isEmergency: false,
    priority: 0,
    estimatedWait: 0,
    reason: 'High fever and sore throat',
    startedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // started 2 mins ago
  },
  {
    id: 'token-3',
    clinicId: 'clinic-1',
    patientId: 'pat-1',
    patientName: 'Alex Harrison',
    patientAge: 34,
    patientGender: 'Male',
    doctorId: 'doc-1',
    tokenNumber: 'SJ-042',
    status: 'WAITING',
    isEmergency: false,
    priority: 0,
    estimatedWait: 12,
    reason: 'Routine cardiovascular check-up',
  },
  {
    id: 'token-4',
    clinicId: 'clinic-1',
    patientId: 'pat-2',
    patientName: 'Emily Watson',
    patientAge: 29,
    patientGender: 'Female',
    doctorId: 'doc-1',
    tokenNumber: 'SJ-043',
    status: 'WAITING',
    isEmergency: false,
    priority: 0,
    estimatedWait: 24,
    reason: 'Mild chest tightness during exercise',
  },
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'v-1',
    patientId: 'pat-1',
    patientName: 'Alex Harrison',
    doctorName: 'Dr. Sarah Jenkins',
    date: '2026-03-12',
    diagnosis: 'Mild hypertension',
    prescription: ['Lisinopril 10mg daily', 'Omega-3 Fish Oil 1000mg daily'],
    notes: 'Patient advised to reduce sodium intake and perform regular light aerobic exercise.',
  },
  {
    id: 'v-2',
    patientId: 'pat-1',
    patientName: 'Alex Harrison',
    doctorName: 'Dr. Sarah Jenkins',
    date: '2025-10-05',
    diagnosis: 'Seasonal Allergies',
    prescription: ['Cetirizine 10mg as needed', 'Fluticasone nasal spray'],
    notes: 'Allergy symptoms flare during autumn. Recommended to stay indoors during high pollen counts.',
  },
  {
    id: 'v-3',
    patientId: 'pat-3',
    patientName: 'James Carter',
    doctorName: 'Dr. Robert Chen',
    date: '2026-06-18',
    diagnosis: 'Common Cold',
    prescription: ['Acetaminophen 500mg as needed', 'Vitamin C 500mg daily'],
    notes: 'Rest and hydration. Follow up if symptoms persist beyond 10 days.',
  },
];

export const INITIAL_REPORTS: MedicalReport[] = [
  {
    id: 'rep-1',
    patientId: 'pat-1',
    fileName: 'blood_panel_march_2026.pdf',
    fileType: 'pdf',
    reportType: 'Complete Blood Count & Lipid Panel',
    uploadedAt: '2026-03-12T10:30:00Z',
    size: '1.2 MB',
  },
  {
    id: 'rep-2',
    patientId: 'pat-1',
    fileName: 'chest_xray_cardio_check.png',
    fileType: 'image',
    reportType: 'Chest X-Ray',
    uploadedAt: '2026-07-20T08:15:00Z',
    size: '4.7 MB',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'not-1',
    title: 'Appointment Confirmed',
    body: 'Your appointment with Dr. Sarah Jenkins is scheduled for today at 6:00 PM.',
    time: '2 hours ago',
    isRead: false,
    channel: 'EMAIL',
  },
  {
    id: 'not-2',
    title: 'Checked In Successfully',
    body: 'Welcome to CareFirst! You are checked in. Your queue token is SJ-042. Estimated wait: 12 mins.',
    time: '15 mins ago',
    isRead: false,
    channel: 'PUSH',
  },
];

// Mock AI Prediction data
export const AI_PREDICTIONS = {
  waitTimePrediction: {
    predictedWait: '8 min',
    confidence: '94%',
    factors: ['Fewer emergency calls', 'Dr. Jenkins consulting 1.2x faster today', 'Low walk-in arrival rate'],
  },
  queueOptimization: {
    recommendation: 'Divert general health checks to Room 104',
    estimatedSavings: '14 min avg wait time reduction',
  },
  noShowPrediction: {
    patientId: 'pat-2',
    riskScore: '18%', // Low risk
    reasons: ['Has confirmed via text', 'Historically 100% attendance rate'],
  },
  peakHourForecast: [
    { hour: '09:00', load: 45 },
    { hour: '10:00', load: 80 },
    { hour: '11:00', load: 95 }, // Peak
    { hour: '12:00', load: 60 },
    { hour: '13:00', load: 30 },
    { hour: '14:00', load: 55 },
    { hour: '15:00', load: 75 },
    { hour: '16:00', load: 90 }, // Peak
    { hour: '17:00', load: 40 },
  ],
};
