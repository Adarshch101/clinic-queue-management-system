import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export interface UserSessionProfile {
  userId: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN' | 'SUPER_ADMIN';
  clinicId?: string;
  clinicStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';
  permissions: string[];
}

export const authService = {
  // Patient/User Registration Action
  async registerPatient(data: {
    name: string;
    email: string;
    phone: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    password: string;
  }) {
    // 1. Trigger signup in Supabase Auth (user data is stored as metadata so it
    //    lives in Supabase too, not only in the PostgreSQL profile row)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          age: data.age,
          gender: data.gender,
          role: 'PATIENT',
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned');
    const userId = authData.user.id;

    // 2. Establish a session first so the server can verify account ownership
    //    when binding the patient profile (closes profile-poisoning).
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (loginError) throw loginError;
    const accessToken = session?.access_token;

    // Persist the user data into Supabase Auth metadata (belt-and-braces in
    // case the sign-up payload was stripped). Non-fatal: the canonical profile
    // is the PostgreSQL row.
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        name: data.name,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        role: 'PATIENT',
      },
    });
    if (metaError) {
      console.warn('Failed to persist patient metadata to Supabase:', metaError.message);
    }

    // 3. Call register-patient API to write patient profile to PostgreSQL
    const res = await fetch('/api/auth/register-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        accessToken,
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || 'Failed to complete patient database registration');
    }

    const resData = await res.json();

    // 4. Auto-login after successful registration
    if (session?.access_token) {
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
      });
    }

    await this.logAuditEvent(
      userId,
      'REGISTRATION',
      `Registered patient account "${data.name}"`,
    );

    return resData;
  },

  // Helper to log audit events into the database
  async logAuditEvent(userId: string, action: string, details: string, clinicId?: string) {
    try {
      await fetch('/api/auth/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, details, clinicId }),
      });
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  },

  // Clinic Signup Action
  async registerClinic(data: {
    clinicName: string;
    subdomain: string;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    password: string;
  }) {
    // 1. Trigger signup in Supabase Auth (user data is stored as metadata so it
    //    lives in Supabase too, not only in the PostgreSQL profile row)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.ownerName,
          phone: data.phone,
          role: 'ADMIN',
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned');
    const userId = authData.user.id;

    // 2. Establish a session first so the server can verify account ownership
    //    when binding the ClinicAdmin profile.
    const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (sessionError) throw sessionError;
    const accessToken = session?.access_token;

    // Persist the user data into Supabase Auth metadata (belt-and-braces).
    // Non-fatal: the canonical profile is the PostgreSQL row.
    const { error: clinicMetaError } = await supabase.auth.updateUser({
      data: {
        name: data.ownerName,
        phone: data.phone,
        role: 'ADMIN',
      },
    });
    if (clinicMetaError) {
      console.warn('Failed to persist admin metadata to Supabase:', clinicMetaError.message);
    }

    // 3. Call register API to write clinic and default admin profile to PostgreSQL
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        accessToken,
        ...data,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || 'Failed to complete clinic database registration');
    }

    const resData = await res.json();

    // 4. Mint the signed server-side session cookie for the new admin.
    if (session?.access_token) {
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session.access_token }),
      });
    }

    // Log registration audit event
    await this.logAuditEvent(
      userId,
      'REGISTRATION',
      `Registered clinic "${data.clinicName}" on subdomain "${data.subdomain}"`,
      resData.clinicId
    );

    return resData;
  },

  // Login Action
  async login(email: string, password: string) {
    let authUser: User | null = null;

    // Supabase is the only authentication provider. There is intentionally no
    // passwordless fallback: failing closed prevents any credential bypass.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      await this.logAuditEvent('anonymous', 'FAILED_LOGIN', `Failed login attempt for ${email}`);
      throw authError;
    }
    authUser = authData.user;

    if (!authUser) throw new Error('Authentication failed: No user returned');

    // Resolve user session profile from PostgreSQL API
    const sessionProfile = await this.getCurrentSessionProfile(authUser.id, authUser.email || email);
    
    // Verify clinic verification status if user is clinic staff/admin
    if (sessionProfile.clinicStatus && sessionProfile.clinicStatus !== 'VERIFIED') {
      if (sessionProfile.role !== 'SUPER_ADMIN') {
        await supabase.auth.signOut();
        throw new Error(`CLINIC_${sessionProfile.clinicStatus}`);
      }
    }

    // Mint a signed, httpOnly session cookie server-side (client cannot forge one)
    const { data: { session: supabaseSession } } = await supabase.auth.getSession();
    if (supabaseSession?.access_token) {
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: supabaseSession.access_token }),
      });
    }

    await this.logAuditEvent(
      authUser.id,
      'LOGIN',
      `Successfully logged in as ${sessionProfile.role}`,
      sessionProfile.clinicId
    );

    return { user: authUser, profile: sessionProfile };
  },

  // Get logged-in user profile details and role permissions
  async getCurrentSessionProfile(userId: string, email?: string): Promise<UserSessionProfile> {
    const url = email
      ? `/api/auth/session?userId=${userId}&email=${encodeURIComponent(email)}`
      : `/api/auth/session?userId=${userId}`;

    // Attach the Supabase access token so the server can verify that the
    // caller owns the requested profile (prevents profile enumeration).
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch session profile');
    }
    return res.json();
  },

  // Forgot Password / Reset Link trigger
  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
    await this.logAuditEvent('anonymous', 'PASSWORD_RESET_REQUEST', `Requested password reset link for ${email}`);
  },

  // Update password with token
  async resetPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await this.logAuditEvent(user.id, 'PASSWORD_RESET_SUCCESS', 'Successfully reset account password');
    }
  },

  // Logout Action
  async logout(userId?: string, clinicId?: string) {
    try {
      // Clear the server-side signed session cookie
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      console.warn('Session signout notice:', e);
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut notice:', e);
    }
    if (userId) {
      await this.logAuditEvent(userId, 'LOGOUT', 'User logged out', clinicId);
    }
  }
};
