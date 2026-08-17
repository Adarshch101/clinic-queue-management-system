import { prisma } from './prisma';

export type ResolvedRole = 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type ClinicStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';

export interface ResolvedProfile {
  userId: string;
  name: string;
  email: string;
  role: ResolvedRole;
  clinicId?: string;
  clinicStatus?: ClinicStatus;
  permissions: string[];
}

/**
 * Resolves a user's platform role + permissions by scanning the profile tables.
 * SUPER_ADMIN is granted when the email matches the SUPER_ADMIN_EMAIL env value.
 */
export async function resolveProfile(userId: string, email?: string): Promise<ResolvedProfile> {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@q-clinix.com').toLowerCase();
  const normalizedEmail = email?.toLowerCase();

  if (normalizedEmail && normalizedEmail === superAdminEmail) {
    return {
      userId,
      name: 'Super Admin',
      email: normalizedEmail,
      role: 'SUPER_ADMIN',
      permissions: ['*'],
    };
  }

  let profile: { name: string; email: string | null } | null = null;
  let role: ResolvedRole = 'PATIENT';
  let clinicId: string | undefined;
  let clinicStatus: ClinicStatus | undefined;

  const admin = await prisma.clinicAdmin.findUnique({
    where: { userId },
    include: { clinic: true },
  });
  if (admin) {
    profile = admin;
    role = 'ADMIN';
    clinicId = admin.clinicId;
    clinicStatus = admin.clinic.status as ClinicStatus;
  }

  if (!profile) {
    const doc = await prisma.doctor.findUnique({
      where: { userId },
      include: { clinic: true },
    });
    if (doc) {
      profile = doc;
      role = 'DOCTOR';
      clinicId = doc.clinicId;
      clinicStatus = doc.clinic.status as ClinicStatus;
    }
  }

  if (!profile) {
    const recep = await prisma.receptionist.findUnique({
      where: { userId },
      include: { clinic: true },
    });
    if (recep) {
      profile = recep;
      role = 'RECEPTIONIST';
      clinicId = recep.clinicId;
      clinicStatus = recep.clinic.status as ClinicStatus;
    }
  }

  if (!profile) {
    const pat = await prisma.patient.findUnique({
      where: { userId },
    });
    if (pat) {
      profile = pat;
      role = 'PATIENT';
      clinicId = pat.clinicId;
    }
  }

  if (profile?.email && profile.email.toLowerCase() === superAdminEmail) {
    role = 'SUPER_ADMIN';
  }

  if (!profile) {
    return {
      userId,
      name: 'Anonymous Patient',
      email: '',
      role: 'PATIENT',
      permissions: ['SEARCH_CLINICS', 'JOIN_QUEUE', 'TRACK_QUEUE'],
    };
  }

  const dbPermissions = await prisma.permission.findMany({
    where: { role },
  });

  let permissions = dbPermissions.map((p) => `${p.action}_${p.resource}`);

  if (permissions.length === 0) {
    if (role === 'ADMIN') {
      permissions = [
        'MANAGE_CLINIC',
        'MANAGE_STAFF',
        'VIEW_QUEUE',
        'EDIT_QUEUE',
        'DELETE_QUEUE',
        'VIEW_REPORTS',
        'MANAGE_SETTINGS',
      ];
    } else if (role === 'DOCTOR') {
      permissions = ['VIEW_QUEUE', 'EDIT_QUEUE', 'CONSULT_PATIENTS', 'VIEW_PATIENT_FILES'];
    } else if (role === 'RECEPTIONIST') {
      permissions = ['VIEW_QUEUE', 'EDIT_QUEUE', 'CREATE_QUEUE_TICKET', 'CHECK_IN_PATIENTS'];
    } else {
      permissions = ['SEARCH_CLINICS', 'JOIN_QUEUE', 'TRACK_QUEUE'];
    }
  }

  return {
    userId,
    name: profile.name,
    email: profile.email as string,
    role,
    clinicId,
    clinicStatus,
    permissions,
  };
}