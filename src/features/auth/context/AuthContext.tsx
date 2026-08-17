'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { authService, UserSessionProfile } from '../services/authService';
import { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  profile: UserSessionProfile | null;
  tempSessionId: string | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserSessionProfile | null>(null);
  const [tempSessionId, setTempSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize patient temporary session id
  const initializeTempSession = () => {
    if (typeof window !== 'undefined') {
      let storedId = localStorage.getItem('temp_patient_session_id');
      if (!storedId) {
        storedId = `temp_pat_${crypto.randomUUID()}`;
        localStorage.setItem('temp_patient_session_id', storedId);
      }
      setTempSessionId(storedId);
    }
  };

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        const p = await authService.getCurrentSessionProfile(session.user.id, session.user.email);
        setProfile(p);
      } else {
        // No Supabase session — check for a valid signed server-side session cookie
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const p = await meRes.json();
          setUser({
            id: p.userId,
            email: `${p.role?.toLowerCase() || 'user'}@q-clinix.com`,
            user_metadata: { name: p.role }
          } as unknown as User);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
          initializeTempSession();
        }
      }
    } catch (err) {
      console.error('Failed to sync session profile:', err);
      setUser(null);
      setProfile(null);
      initializeTempSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => refreshProfile(), 0);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          try {
            const p = await authService.getCurrentSessionProfile(session.user.id);
            setProfile(p);
          } catch (e) {
            console.error('Auth status change sync failed:', e);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (typeof document !== 'undefined') {
          document.cookie = 'q-clinix-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
        setUser(null);
        setProfile(null);
        initializeTempSession();
      }
    });

    return () => {
      clearTimeout(id);
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false;
    // Super admins possess bypass access to everything
    if (profile.role === 'SUPER_ADMIN') return true;
    return profile.permissions.includes(permission);
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'q-clinix-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      await authService.logout(user?.id, profile?.clinicId);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      initializeTempSession();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        tempSessionId,
        loading,
        hasPermission,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
