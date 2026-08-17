import { prisma } from './prisma';

export type ResolvedRole = 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type ClinicStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';

// The role column on profile tables is the source of truth; fall back to the
// role implied by the table if a legacy row somehow has no value.
function roleFromColumn(value: unknown, fallback: ResolvedRole): ResolvedRole {
  return ['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(String(value))
    ? (value as ResolvedRole)
    : fallback;
}

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
    role = roleFromColumn(admin.role, 'ADMIN');
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
      role = roleFromColumn(doc.role, 'DOCTOR');
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
      role = roleFromColumn(recep.role, 'RECEPTIONIST');
      clinicId = recep.clinicId;
      clinicStatus = recep.clinic.status as ClinicStatus;
    }
  }

  // Profiles created by an admin invitation carry the invitee's email but not
  // yet their Supabase auth userId. Match by email as a fallback so invited
  // staff can sign in with the account they were invited under.
  if (!profile && normalizedEmail) {
    const adminByEmail = await prisma.clinicAdmin.findFirst({
      where: { email: normalizedEmail },
      include: { clinic: true },
    });
    if (adminByEmail) {
      profile = adminByEmail;
      role = roleFromColumn(adminByEmail.role, 'ADMIN');
      clinicId = adminByEmail.clinicId;
      clinicStatus = adminByEmail.clinic.status as ClinicStatus;
    } else {
      const docByEmail = await prisma.doctor.findFirst({
        where: { email: normalizedEmail },
        include: { clinic: true },
      });
      if (docByEmail) {
        profile = docByEmail;
        role = roleFromColumn(docByEmail.role, 'DOCTOR');
        clinicId = docByEmail.clinicId;
        clinicStatus = docByEmail.clinic.status as ClinicStatus;
      } else {
        const recepByEmail = await prisma.receptionist.findFirst({
          where: { email: normalizedEmail },
          include: { clinic: true },
        });
        if (recepByEmail) {
          profile = recepByEmail;
          role = roleFromColumn(recepByEmail.role, 'RECEPTIONIST');
          clinicId = recepByEmail.clinicId;
          clinicStatus = recepByEmail.clinic.status as ClinicStatus;
        }
      }
    }
  }

  if (!profile) {
    const pat = await prisma.patient.findUnique({
      where: { userId },
    });
    if (pat) {
      profile = pat;
      role = roleFromColumn(pat.role, 'PATIENT');
      clinicId = pat.clinicId ?? undefined;
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