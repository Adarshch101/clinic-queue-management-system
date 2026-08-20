import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/apiAuth';
import { NotificationEngine } from '@/lib/notificationEngine';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const STAFF_ROLES = ['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN'] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

async function resolveProfileByUserId(userId: string) {
  const [patient, admin, doctor, receptionist] = await Promise.all([
    prisma.patient.findUnique({ where: { userId } }),
    prisma.clinicAdmin.findUnique({ where: { userId } }),
    prisma.doctor.findUnique({ where: { userId } }),
    prisma.receptionist.findUnique({ where: { userId } }),
  ]);
  if (admin) {
    const { role, ...rest } = admin;
    return { table: 'clinicAdmin' as const, role: role as StaffRole, ...rest };
  }
  if (doctor) {
    const { role, ...rest } = doctor;
    return { table: 'doctor' as const, role: role as StaffRole, ...rest };
  }
  if (receptionist) {
    const { role, ...rest } = receptionist;
    return { table: 'receptionist' as const, role: role as StaffRole, ...rest };
  }
  if (patient) {
    const { role, ...rest } = patient;
    return { table: 'patient' as const, role: role as StaffRole, ...rest };
  }
  return null;
}

function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const auth = requireRole(request, ['SUPER_ADMIN']);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const resolvedAdminId = session.userId;

    // --- Action 1: Toggle Feature Flags ---
    if (action === 'toggle-flag') {
      const { flagName, isEnabled } = body;
      const updated = await prisma.featureFlag.update({
        where: { name: flagName },
        data: { isEnabled },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'TOGGLE_FEATURE_FLAG',
          details: `Feature flag ${flagName} set to ${isEnabled}`,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 2: Toggle Maintenance Mode ---
    if (action === 'maintenance') {
      const { isEnabled, settingsId } = body;
      const updated = await prisma.platformSettings.update({
        where: { id: settingsId },
        data: { maintenance: isEnabled },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'TOGGLE_MAINTENANCE_MODE',
          details: `Platform maintenance mode set to ${isEnabled}`,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 3: Save Platform Settings ---
    if (action === 'platform-settings') {
      const { settingsId, platformName, brandingColor, supportEmail, supportPhone } = body;
      const updated = await prisma.platformSettings.update({
        where: { id: settingsId },
        data: {
          platformName,
          brandingColor,
          supportEmail,
          supportPhone,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 4: Clinic Status Transition (Suspend, Reactivate, Reject, Approve) ---
    if (action === 'clinic-status') {
      const { clinicId, status, notes } = body;
      const updated = await prisma.clinic.update({
        where: { id: clinicId },
        data: { status },
      });

      // If status matches a verification review step, log to verification requests
      const requestRecord = await prisma.verificationRequest.findFirst({
        where: { clinicId },
        orderBy: { submittedAt: 'desc' },
      });

      if (requestRecord) {
        await prisma.verificationHistory.create({
          data: {
            requestId: requestRecord.id,
            action: status === 'VERIFIED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'REQUEST_CHANGES',
            performedBy: resolvedAdminId,
            performedByRole: 'SUPER_ADMIN',
            notes: notes || `Clinic status updated to ${status}`,
          },
        });
      }

      // Audit Log
      await prisma.auditLog.create({
        data: {
          clinicId,
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: `CLINIC_${status}`,
          details: `Clinic ${updated.name} verification status set to ${status}`,
        },
      });

      return NextResponse.json(updated);
    }

    // --- Action 5: Create Announcements ---
    if (action === 'announcement') {
      const { title, content, target, status } = body;
      const updated = await prisma.announcement.create({
        data: {
          title,
          content,
          target: target || 'ALL',
          status: status || 'PUBLISHED',
        },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'PUBLISH_ANNOUNCEMENT',
          details: `Announcement published: "${title}"`,
        },
      });
      return NextResponse.json(updated);
    }

    // --- Action 6: Delete Clinic ---
    if (action === 'delete-clinic') {
      const { clinicId } = body;
      await prisma.clinic.delete({
        where: { id: clinicId },
      });
      // Audit log
      await prisma.auditLog.create({
        data: {
          clinicId: 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'DELETE_CLINIC',
          details: `Clinic deleted permanently: ID ${clinicId}`,
        },
      });
      return NextResponse.json({ success: true });
    }

    // --- Action 7: Delete User (hard delete of the profile + cascaded records) ---
    if (action === 'delete-user') {
      const { id, role } = body;
      if (!id || !isStaffRole(role)) {
        return NextResponse.json({ error: 'Missing or invalid id/role' }, { status: 400 });
      }

      let name = '';
      let clinicId = 'global';
      let deletedUserId: string | null = null;
      if (role === 'PATIENT') {
        const profile = await prisma.patient.findUnique({ where: { id } });
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        name = profile.name;
        clinicId = profile.clinicId ?? 'global';
        deletedUserId = profile.userId;
        await prisma.patient.delete({ where: { id } });
      } else if (role === 'ADMIN') {
        const profile = await prisma.clinicAdmin.findUnique({ where: { id } });
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        name = profile.name;
        clinicId = profile.clinicId;
        deletedUserId = profile.userId;
        await prisma.clinicAdmin.delete({ where: { id } });
      } else if (role === 'DOCTOR') {
        const profile = await prisma.doctor.findUnique({ where: { id } });
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        name = profile.name;
        clinicId = profile.clinicId;
        deletedUserId = profile.userId;
        await prisma.doctor.delete({ where: { id } });
      } else if (role === 'RECEPTIONIST') {
        const profile = await prisma.receptionist.findUnique({ where: { id } });
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        name = profile.name;
        clinicId = profile.clinicId;
        deletedUserId = profile.userId;
        await prisma.receptionist.delete({ where: { id } });
      }

      // Revoke the Supabase Auth account too (real accounts only — invites use
      // synthetic staff-auth ids with no Auth row to delete).
      if (deletedUserId && !deletedUserId.startsWith('staff-auth') && supabaseAdmin) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(deletedUserId);
        if (authError) {
          console.error(`Failed to delete Supabase auth user ${deletedUserId}:`, authError.message);
        }
      }

      await prisma.auditLog.create({
        data: {
          clinicId,
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'DELETE_USER',
          details: `Deleted ${role} user "${name}" (profile ${id})`,
        },
      });
      return NextResponse.json({ success: true });
    }

    // --- Action 8: Change User Role (moves the profile across role tables) ---
    if (action === 'change-role') {
      const { userId, role } = body;
      if (!userId || !isStaffRole(role)) {
        return NextResponse.json({ error: 'Missing or invalid userId/role' }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const [patient, admin, doctor, receptionist] = await Promise.all([
          tx.patient.findUnique({ where: { userId } }),
          tx.clinicAdmin.findUnique({ where: { userId } }),
          tx.doctor.findUnique({ where: { userId } }),
          tx.receptionist.findUnique({ where: { userId } }),
        ]);

        const source = admin
          ? { table: 'clinicAdmin' as const, role: 'ADMIN' as StaffRole, name: admin.name, email: admin.email, phone: admin.phone, clinicId: admin.clinicId }
          : doctor
            ? { table: 'doctor' as const, role: 'DOCTOR' as StaffRole, name: doctor.name, email: doctor.email, phone: doctor.phone, clinicId: doctor.clinicId }
            : receptionist
              ? { table: 'receptionist' as const, role: 'RECEPTIONIST' as StaffRole, name: receptionist.name, email: receptionist.email, phone: null, clinicId: receptionist.clinicId }
              : patient
                ? { table: 'patient' as const, role: 'PATIENT' as StaffRole, name: patient.name, email: patient.email, phone: patient.phone, clinicId: patient.clinicId ?? null }
                : null;

        if (!source) throw new Error('User not found');
        if (source.role === role) return source;

        if (role !== 'PATIENT' && !source.clinicId) {
          throw new Error('Cannot promote a user without a clinic assignment to a staff role');
        }

        const common = {
          userId,
          name: source.name,
          email: source.email || '',
          clinicId: source.clinicId ?? '',
        };

        if (role === 'ADMIN') {
          await tx.clinicAdmin.create({ data: { ...common, phone: source.phone } });
        } else if (role === 'DOCTOR') {
          await tx.doctor.create({
            data: {
              ...common,
              phone: source.phone,
              specialization: 'General Medicine',
              roomNumber: '1',
            },
          });
        } else if (role === 'RECEPTIONIST') {
          await tx.receptionist.create({ data: common });
        } else if (role === 'PATIENT') {
          await tx.patient.create({
            data: {
              clinicId: source.clinicId,
              userId,
              name: source.name,
              email: source.email || null,
              phone: source.phone || '',
              age: 0,
              gender: 'Other',
            },
          });
        }

        await (tx[source.table] as unknown as { delete: (args: { where: { userId: string } }) => Promise<unknown> }).delete({
          where: { userId },
        });
        return source;
      });

      // Keep the Supabase Auth metadata role in sync (real accounts only).
      if (supabaseAdmin && !userId.startsWith('staff-auth')) {
        const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { name: result.name, role },
        });
        if (metaError) {
          console.error(`Failed to sync Supabase metadata for ${userId}:`, metaError.message);
        }
      }

      await prisma.auditLog.create({
        data: {
          clinicId: result.clinicId ?? 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: 'ROLE_CHANGE',
          details: `Changed user "${result.name}" (${userId}) role from ${result.role} to ${role}`,
        },
      });
      return NextResponse.json({ success: true });
    }

    // --- Action 9: Send Warning / Appreciation to a user ---
    if (action === 'notify-user') {
      const { userId, type, message } = body;
      if (!userId || !['WARNING', 'APPRECIATION'].includes(type) || !message?.trim()) {
        return NextResponse.json({ error: 'Missing or invalid userId/type/message' }, { status: 400 });
      }

      const profile = await resolveProfileByUserId(userId);
      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const title =
        type === 'WARNING' ? 'Warning from Platform Administrator' : 'Appreciation from Platform Administrator';

      await prisma.notification.create({
        data: {
          recipientUserId: userId,
          title,
          body: message.trim(),
          channel: 'PUSH',
        },
      });

      NotificationEngine.dispatchEvent('SUPER_ADMIN_MESSAGE', {
        userId,
        email: profile.email || '',
        title,
        message: message.trim(),
        type,
      }).catch((err: unknown) => {
        console.error('Super admin message dispatch failed:', err);
      });

      await prisma.auditLog.create({
        data: {
          clinicId: profile.clinicId ?? 'global',
          userId: resolvedAdminId,
          userRole: 'SUPER_ADMIN',
          action: type === 'WARNING' ? 'SEND_WARNING' : 'SEND_APPRECIATION',
          details: `${type} sent to "${profile.name}" (${userId}): ${message.trim().slice(0, 120)}`,
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('API Super Admin Action error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
