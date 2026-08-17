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
    // 1. Trigger signup in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user returned');
    const userId = authData.user.id;

    // 2. Call register API to write clinic and default admin profile to PostgreSQL
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...data,
      }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.error || 'Failed to complete clinic database registration');
    }

    const resData = await res.json();
    
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

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      authUser = authData.user;
    } catch (err) {
      console.warn('Supabase auth login failed, checking fallback PostgreSQL database records:', err);
      const res = await fetch('/api/auth/login-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        await this.logAuditEvent('anonymous', 'FAILED_LOGIN', `Failed login attempt for ${email}`);
        throw new Error('Invalid email or password credentials');
      }
      const fallbackData = await res.json();
      authUser = fallbackData.user;
    }

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
    const res = await fetch(url);
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
