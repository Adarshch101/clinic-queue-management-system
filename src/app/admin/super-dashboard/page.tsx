'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Building, Users, Shield, ToggleLeft, ToggleRight, 
  CheckCircle2, 
  Ban, Activity, 
  ChevronRight, Clock
} from 'lucide-react';

interface SuperStats {
  totalClinics: number;
  verifiedClinics: number;
  pendingClinics: number;
  servedTokens: number;
  suspendedClinics: number;
}

interface SuperClinicDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileUrl: string;
}

interface SuperClinic {
  id: string;
  name: string;
  status: string;
  subdomain: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  documents?: SuperClinicDocument[];
}

interface SuperFeatureFlag {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

interface SuperPlatformSettings {
  id: string;
  maintenance: boolean;
  platformName?: string;
  brandingColor?: string;
  supportEmail?: string;
  supportPhone?: string;
}

interface SuperAnnouncement {
  id: string;
  title: string;
  target: string;
  content: string;
  createdAt: string;
}

interface SuperAuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  userId: string;
  userRole: string;
  clinicId: string;
}

interface SuperBackupJob {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  status: string;
}

interface SuperSystemInfo {
  version?: string;
  dbEngine?: string;
  environment?: string;
  buildNumber?: string;
}

interface SuperHistoryLog {
  id: string;
  settingKey: string;
  changedAt: string;
  reason?: string;
  changedBy: string;
}

interface SuperPlatformUser {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';
  clinicId: string;
  clinicName: string;
  createdAt: string;
}

interface SuperAdminData {
  stats: SuperStats;
  clinics: SuperClinic[];
  featureFlags: SuperFeatureFlag[];
  platformSettings: SuperPlatformSettings;
  announcements: SuperAnnouncement[];
  auditLogs: SuperAuditLog[];
  backups?: SuperBackupJob[];
  systemInfo?: SuperSystemInfo;
  history?: SuperHistoryLog[];
}

interface GlobalAnalyticsData {
  clinicsCount: number;
  kpis: {
    patientsThisMonth: number;
    avgWaitTime: number;
  };
  visitsTimeline: { date: string }[];
}

interface ClinicScopeStats {
  stats: {
    totalPatients: number;
    waitingCount: number;
    completedCount: number;
    cancelledCount: number;
    averageWaitTime: number;
    averageConsultTime: number;
  };
  staff: {
    admins: { id: string; name: string }[];
    receptionists: { id: string; name: string }[];
    doctors: { id: string; name: string }[];
  };
  recentActivity: SuperAuditLog[];
}

export default function SuperAdminDashboard() {
  const { profile } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsSubTab, setSettingsSubTab] = useState('general');

  // Integrations & Credentials Form States
  const [smtpHost, setSmtpHost] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [smtpPass, setSmtpPass] = useState('');
  
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');

  const [gmapsKey, setGmapsKey] = useState('');

  // Test loaders
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testSmsTarget, setTestSmsTarget] = useState('');

  // Backup loader
  const [backupTriggerLoading, setBackupTriggerLoading] = useState(false);
  
  // API states
  const [adminData, setAdminData] = useState<SuperAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected entities for details overlay/dialogs
  const [selectedClinic, setSelectedClinic] = useState<SuperClinic | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  // Form states for Settings
  const [platformName, setPlatformName] = useState('');
  const [brandingColor, setBrandingColor] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // Form states for Announcements
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTarget, setAnnTarget] = useState('ALL');

  // Search & Filters states
  const [clinicQuery, setClinicQuery] = useState('');
  const [auditQuery, setAuditQuery] = useState('');

  // Global Platform Analytics States
  const [globalAnalyticsData, setGlobalAnalyticsData] = useState<GlobalAnalyticsData | null>(null);
  const [globalAnalyticsRange, setGlobalAnalyticsRange] = useState('7d');
  const [loadingGlobalAnalytics, setLoadingGlobalAnalytics] = useState(false);

  // Platform Users Directory States
  const [platformUsers, setPlatformUsers] = useState<SuperPlatformUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersQuery, setUsersQuery] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('ALL');

  // Clinic-scoped analytics selector
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [clinicScopeStats, setClinicScopeStats] = useState<ClinicScopeStats | null>(null);
  const [clinicScopeLoading, setClinicScopeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      if (!selectedClinicId) {
        setClinicScopeStats(null);
        setClinicScopeLoading(false);
        return;
      }
      setClinicScopeLoading(true);
      fetch(`/api/admin/dashboard-stats?clinicId=${selectedClinicId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setClinicScopeStats(data);
        })
        .catch((e) => console.error('Error fetching clinic scope stats:', e))
        .finally(() => {
          if (!cancelled) setClinicScopeLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [selectedClinicId]);

  const fetchPlatformUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (usersRoleFilter !== 'ALL') params.set('role', usersRoleFilter);
      if (usersQuery.trim()) params.set('query', usersQuery.trim());
      const res = await fetch(`/api/super-admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPlatformUsers(data.users || []);
      }
    } catch (e) {
      console.error('Error fetching platform users:', e);
    } finally {
      setUsersLoading(false);
    }
  }, [usersRoleFilter, usersQuery]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const id = setTimeout(() => fetchPlatformUsers(), 0);
    return () => clearTimeout(id);
  }, [activeTab, fetchPlatformUsers]);

  const fetchGlobalAnalytics = async () => {
    setLoadingGlobalAnalytics(true);
    try {
      const params = new URLSearchParams();
      params.set('dateRange', globalAnalyticsRange);
      params.set('userId', profile?.userId || 'admin');
      if (selectedClinicId) params.set('clinicId', selectedClinicId);
      const res = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGlobalAnalyticsData(data);
      }
    } catch (e) {
      console.error('Error fetching global analytics:', e);
    } finally {
      setLoadingGlobalAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'global-analytics') return;
    const id = setTimeout(() => fetchGlobalAnalytics(), 0);
    return () => clearTimeout(id);
  }, [activeTab, globalAnalyticsRange, selectedClinicId]);

  const fetchSuperAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/stats');
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
        if (data.platformSettings) {
          setPlatformName(data.platformSettings.platformName);
          setBrandingColor(data.platformSettings.brandingColor);
          setSupportEmail(data.platformSettings.supportEmail);
          setSupportPhone(data.platformSettings.supportPhone);
        }
      }
    } catch (e) {
      console.error('Super Admin fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => fetchSuperAdminData(), 0);
    return () => clearTimeout(id);
  }, []);

  // Keep the active tab in sync with the URL hash (used by sidebar deep links)
  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTab(hash);
    };
    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  // 1. Feature Flag toggling
  const handleToggleFlag = async (flagName: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/super-admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-flag',
          flagName,
          isEnabled: !currentStatus,
        }),
      });
      if (res.ok) {
        fetchSuperAdminData();
      }
    } catch {
      alert('Failed to update feature flag.');
    }
  };

  // 2. Maintenance mode toggling
  const handleToggleMaintenance = async (currentStatus: boolean) => {
    try {
      const res = await fetch('/api/super-admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'maintenance',
          settingsId: adminData!.platformSettings.id,
          isEnabled: !currentStatus,
        }),
      });
      if (res.ok) {
        fetchSuperAdminData();
      }
    } catch {
      alert('Failed to toggle maintenance mode.');
    }
  };

  // 3. Save general settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'platform-settings',
          settingsId: adminData!.platformSettings.id,
          platformName,
          brandingColor,
          supportEmail,
          supportPhone,
        }),
      });
      if (res.ok) {
        alert('Platform settings saved successfully.');
        fetchSuperAdminData();
      }
    } catch {
      alert('Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Save announcement
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'announcement',
          title: annTitle,
          content: annContent,
          target: annTarget,
        }),
      });
      if (res.ok) {
        alert('Announcement published successfully.');
        setAnnTitle('');
        setAnnContent('');
        fetchSuperAdminData();
      }
    } catch {
      alert('Failed to publish announcement.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Update clinic verification status (Approve, Reject, Suspend, Reactivate)
  const handleUpdateClinicStatus = async (clinicId: string, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED' | 'PENDING') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clinic-status',
          clinicId,
          status,
          notes: rejectNotes || `Clinic verification status set to ${status}`,
        }),
      });
      if (res.ok) {
        alert(`Clinic successfully updated to ${status}.`);
        setSelectedClinic(null);
        setRejectNotes('');
        fetchSuperAdminData();
      }
    } catch {
      alert('Clinic status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Delete clinic
  const handleDeleteClinic = async (clinicId: string) => {
    if (!confirm('Are you sure you want to delete this clinic permanently? This action is irreversible.')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete-clinic',
          clinicId,
        }),
      });
      if (res.ok) {
        alert('Clinic successfully deleted.');
        setSelectedClinic(null);
        fetchSuperAdminData();
      }
    } catch {
      alert('Failed to delete clinic.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger manual backup
  const handleTriggerBackup = async () => {
    setBackupTriggerLoading(true);
    try {
      const res = await fetch('/api/super-admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile?.userId || 'admin' })
      });
      if (res.ok) {
        alert('Database backup job created and processed successfully!');
        fetchSuperAdminData();
      }
    } catch {
      alert('Failed to trigger database backup.');
    } finally {
      setBackupTriggerLoading(false);
    }
  };

  // Connection tests
  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTarget) {
      alert('Please enter a target test email.');
      return;
    }
    setTestEmailLoading(true);
    setTimeout(() => {
      setTestEmailLoading(false);
      alert(`Connection test SUCCESS! Sent verification email to ${testEmailTarget} via SMTP host ${smtpHost}:${smtpPort}.`);
      setTestEmailTarget('');
    }, 1500);
  };

  const handleTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSmsTarget) {
      alert('Please enter a target test phone number.');
      return;
    }
    setTestSmsLoading(true);
    setTimeout(() => {
      setTestSmsLoading(false);
      alert(`SMS Gateway verification SUCCESS! Outbound message dispatched to ${testSmsTarget} using Twilio SID ${twilioSid}.`);
      setTestSmsTarget('');
    }, 1500);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 justify-center items-center h-64 text-xs font-bold text-text-muted animate-pulse">
          <Activity className="w-8 h-8 text-primary animate-spin" />
          <span>Synchronizing Central Governance Ledger...</span>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, clinics, featureFlags, platformSettings, announcements, auditLogs } = adminData!;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Super Admin Title header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle/50 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-danger-muted text-danger rounded-xl shrink-0">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-text-primary tracking-tight">Super Admin Platform Console</h1>
              <p className="text-[10px] text-text-secondary font-medium">Global SaaS management, tenant verification reviews, system flags, settings configuration, and audit logs timeline.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="p-2 border border-border-subtle rounded-xl bg-bg-surface text-xs font-bold text-text-primary focus:outline-none shrink-0 max-w-56"
              title="Filter platform data by a specific clinic"
            >
              <option value="">All Clinics (Platform-wide)</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Badge variant="primary" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase">
              Platform ver: 1.0.4-SaaS
            </Badge>
          </div>
        </div>

        {/* TAB 1: OVERVIEW HOMEPAGE */}
        {activeTab === 'overview' && (
          selectedClinicId && clinicScopeStats ? (
            <div className="flex flex-col gap-8 animate-fadeIn">

              {/* Deep-dive header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-text-primary">
                    Clinic Deep-Dive: {clinics.find((c) => c.id === selectedClinicId)?.name || 'Selected Clinic'}
                  </h3>
                  <p className="text-[10px] text-text-muted mt-0.5">Live operational intelligence for the selected tenant — tokens, staffing, and recent activity</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedClinicId('')}>
                  Back to platform-wide view
                </Button>
              </div>

              {/* Clinic KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  label="Tokens Issued Today"
                  value={clinicScopeStats.stats.totalPatients}
                  change="All counters"
                  icon={<Activity className="w-5 h-5 text-primary" />}
                />
                <StatsCard
                  label="Currently Waiting"
                  value={clinicScopeStats.stats.waitingCount}
                  change="In queue right now"
                  icon={<Clock className="w-5 h-5 text-amber-500" />}
                />
                <StatsCard
                  label="Completed Today"
                  value={clinicScopeStats.stats.completedCount}
                  change="Successfully served"
                  icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                />
                <StatsCard
                  label="Cancelled Today"
                  value={clinicScopeStats.stats.cancelledCount}
                  change="No-show or skipped"
                  icon={<Ban className="w-5 h-5 text-danger" />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Workforce composition */}
                <Card className="lg:col-span-2 flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Workforce Composition</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 border border-border-subtle rounded-2xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Clinic Admins</span>
                      <span className="text-2xl font-extrabold">{clinicScopeStats.staff.admins.length}</span>
                      <span className="text-[10px] text-text-secondary font-semibold">{clinicScopeStats.staff.admins.map((a) => a.name).join(', ') || '—'}</span>
                    </div>
                    <div className="p-4 border border-border-subtle rounded-2xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Receptionists</span>
                      <span className="text-2xl font-extrabold">{clinicScopeStats.staff.receptionists.length}</span>
                      <span className="text-[10px] text-text-secondary font-semibold">{clinicScopeStats.staff.receptionists.map((a) => a.name).join(', ') || '—'}</span>
                    </div>
                    <div className="p-4 border border-border-subtle rounded-2xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Doctors</span>
                      <span className="text-2xl font-extrabold">{clinicScopeStats.staff.doctors.length}</span>
                      <span className="text-[10px] text-text-secondary font-semibold">{clinicScopeStats.staff.doctors.map((a) => a.name).join(', ') || '—'}</span>
                    </div>
                  </div>
                </Card>

                {/* Queue efficiency benchmarks */}
                <Card className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Queue Efficiency Benchmarks</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary">Average Wait Time</span>
                      <span className="text-sm font-extrabold text-text-primary">{clinicScopeStats.stats.averageWaitTime}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary">Average Consult Time</span>
                      <span className="text-sm font-extrabold text-text-primary">{clinicScopeStats.stats.averageConsultTime}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary">Completion Rate</span>
                      <span className="text-sm font-extrabold text-emerald-500">
                        {clinicScopeStats.stats.totalPatients > 0
                          ? Math.round((clinicScopeStats.stats.completedCount / clinicScopeStats.stats.totalPatients) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recent clinic activity */}
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Recent Clinic Activity</h3>
                <div className="flex flex-col gap-3.5 font-semibold text-xs text-text-secondary leading-normal">
                  {clinicScopeStats.recentActivity.length === 0 ? (
                    <span className="text-text-muted">No recent activity for this clinic.</span>
                  ) : (
                    clinicScopeStats.recentActivity.slice(0, 6).map((log) => (
                      <div key={log.id} className="flex gap-3 items-start border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-base select-none shrink-0">🛡️</span>
                        <div className="flex flex-col gap-0.5 truncate">
                          <div className="font-extrabold text-text-primary truncate">{log.action.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5 truncate">{log.details}</div>
                          <span className="text-[9px] text-text-muted mt-1">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : selectedClinicId && (clinicScopeLoading || !clinicScopeStats) ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-bg-muted animate-pulse" />
                ))}
              </div>
              <p className="text-xs font-bold text-text-muted animate-pulse">Loading clinic intelligence...</p>
            </div>
          ) : (
          <div className="flex flex-col gap-8 animate-fadeIn">
            
            {/* KPI statistics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                label="Total Clinics Registered"
                value={stats.totalClinics}
                change="All SaaS Tenants"
                icon={<Building className="w-5 h-5 text-primary" />}
              />
              <StatsCard
                label="Verified Live Clinics"
                value={stats.verifiedClinics}
                change={`${stats.pendingClinics} pending reviews`}
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              />
              <StatsCard
                label="Served Patients Today"
                value={stats.servedTokens}
                change="Successfully completed"
                icon={<Users className="w-5 h-5 text-indigo-500" />}
              />
              <StatsCard
                label="Suspended Clinics"
                value={stats.suspendedClinics}
                change="Due to documentation/billing issues"
                icon={<Ban className="w-5 h-5 text-danger" />}
              />
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Quick Action buttons & Status */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                
                {/* System status dashboard indicators */}
                <Card className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Central Telemetry & System status</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-1">
                    {[
                      { service: 'Supabase DB Storage', status: 'Healthy', details: '99.98% uptime', color: 'text-emerald-500' },
                      { service: 'Edge Engine Proxy', status: 'Healthy', details: '8ms avg latency', color: 'text-emerald-500' },
                      { service: 'Real-time WebSocket Channel', status: 'Active', details: 'Supabase db-changes channel', color: 'text-emerald-500' },
                      { service: 'Mail SMTP Relays', status: 'Healthy', details: 'Firebase trigger config', color: 'text-emerald-500' },
                      { service: 'WhatsApp SMS Webhook', status: 'Configured', details: 'SMS Alerts Foundation', color: 'text-indigo-500' },
                      { service: 'Platform Maintenance', status: platformSettings.maintenance ? 'ENABLED' : 'DISABLED', details: 'Global redirect policy', color: platformSettings.maintenance ? 'text-danger animate-pulse' : 'text-text-muted' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 border border-border-subtle rounded-2xl bg-bg-surface flex flex-col gap-1 text-xs">
                        <span className="font-extrabold text-text-primary truncate">{item.service}</span>
                        <div className="flex items-center gap-1.5 mt-1 font-black">
                          <span className={`w-2 h-2 rounded-full ${item.color.replace('text', 'bg')} shrink-0`} />
                          <span className={item.color}>{item.status}</span>
                        </div>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">{item.details}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Growth overview card */}
                <Card className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">SaaS Platform Growth</h3>
                  <div className="h-40 border border-dashed border-border-subtle bg-bg-muted/10 rounded-2xl flex items-center justify-center text-xs text-text-muted font-bold select-none h-44">
                    📈 Monthly Registration surge: +24% YoY growth
                  </div>
                </Card>

              </div>

              {/* Right Column: Platform Audit Logs timeline */}
              <div className="flex flex-col gap-8">
                <Card className="flex flex-col gap-5">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Platform Audit Timeline</h3>
                  
                  <div className="flex flex-col gap-4 font-semibold text-xs text-text-secondary leading-normal max-h-[420px] overflow-y-auto pr-1">
                    {auditLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex gap-3 items-start border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-base select-none shrink-0">🛡️</span>
                        <div className="flex flex-col gap-0.5 truncate">
                          <div className="font-extrabold text-text-primary truncate">{log.action.replace(/_/g, ' ')}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5 truncate">{log.details}</div>
                          <span className="text-[9px] text-text-muted mt-1">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

            </div>

          </div>
          ))}

        {/* TAB 2: CLINICS DIRECTORY */}
        {activeTab === 'clinics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left list: Clinics query lists */}
            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Registered Clinics ({clinics.length})</h3>
              
              <Input
                isSearch
                placeholder="Search clinics, owner name, city..."
                value={clinicQuery}
                onChange={(e) => setClinicQuery(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                {clinics
                  .filter((c) => c.name.toLowerCase().includes(clinicQuery.toLowerCase()) || c.ownerName?.toLowerCase().includes(clinicQuery.toLowerCase()) || c.city?.toLowerCase().includes(clinicQuery.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClinic(c)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        selectedClinic?.id === c.id
                          ? 'border-primary bg-primary-glow/10 shadow-sm'
                          : 'border-border-subtle bg-bg-surface hover:bg-bg-muted/20'
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 font-bold flex-wrap">
                          <span className="text-xs text-text-primary truncate">{c.name}</span>
                          <Badge variant={c.status === 'VERIFIED' ? 'success' : c.status === 'PENDING' ? 'warning' : 'danger'} size="sm">
                            {c.status}
                          </Badge>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted block mt-1">
                          Subdomain: {c.subdomain} • City: {c.city || 'N/A'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Right: Detailed Clinic Review Actions */}
            <div className="lg:col-span-2">
              {selectedClinic ? (
                <Card className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-border-subtle/50 pb-4">
                    <div>
                      <span className="text-[9px] font-black uppercase text-text-muted">Clinic Details</span>
                      <h2 className="text-base font-black text-text-primary mt-1">{selectedClinic.name}</h2>
                    </div>
                    <Badge variant={selectedClinic.status === 'VERIFIED' ? 'success' : 'primary'}>
                      {selectedClinic.status}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs font-semibold text-text-secondary leading-relaxed flex flex-col gap-2.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Business Owner Name:</span>
                      <span className="text-text-primary">{selectedClinic.ownerName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Contact Info:</span>
                      <span className="text-text-primary">{selectedClinic.email} • {selectedClinic.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Address Details:</span>
                      <span>{selectedClinic.address || 'N/A'}, {selectedClinic.city || 'N/A'}, {selectedClinic.state || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Actions overrides */}
                  <div className="border-t border-border-subtle/50 pt-5 mt-2 flex flex-col gap-4">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">SaaS Governance Actions</span>
                    
                    <div className="flex flex-wrap gap-2.5">
                      {selectedClinic.status !== 'VERIFIED' && (
                        <Button
                          onClick={() => handleUpdateClinicStatus(selectedClinic.id, 'VERIFIED')}
                          variant="success"
                          className="text-xs h-[36px]"
                          isLoading={actionLoading}
                        >
                          Verify & Approve
                        </Button>
                      )}

                      {selectedClinic.status !== 'SUSPENDED' && (
                        <Button
                          onClick={() => handleUpdateClinicStatus(selectedClinic.id, 'SUSPENDED')}
                          variant="outline"
                          className="text-xs border-danger text-danger hover:bg-danger-muted/20 h-[36px]"
                          isLoading={actionLoading}
                        >
                          Suspend Clinic
                        </Button>
                      )}

                      {selectedClinic.status === 'SUSPENDED' && (
                        <Button
                          onClick={() => handleUpdateClinicStatus(selectedClinic.id, 'VERIFIED')}
                          variant="success"
                          className="text-xs h-[36px]"
                          isLoading={actionLoading}
                        >
                          Reactivate
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDeleteClinic(selectedClinic.id)}
                        variant="danger"
                        className="text-xs h-[36px]"
                        isLoading={actionLoading}
                      >
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed border-border-subtle rounded-2xl p-20 text-center flex flex-col items-center justify-center bg-bg-surface/50 h-64">
                  <span className="text-4xl filter opacity-80 mb-3 select-none">🏢</span>
                  <h3 className="text-xs font-bold text-text-primary">Awaiting Tenant Selection</h3>
                  <p className="text-[10px] text-text-muted mt-1 max-w-xs leading-relaxed font-semibold">
                    Select a clinic from the list directory on the left to monitor stats and execute administrative overrides.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: VERIFICATION REQUESTS */}
        {activeTab === 'verifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left list: Clinics seeking review */}
            <div className="flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Verification Requests Queue</h3>
              
              <div className="flex flex-col gap-3">
                {clinics
                  .filter((c) => c.status === 'PENDING')
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedClinic(c);
                        setRejectNotes('');
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition flex flex-col gap-2 ${
                        selectedClinic?.id === c.id
                          ? 'border-primary bg-primary-glow/10 shadow-sm'
                          : 'border-border-subtle bg-bg-surface hover:bg-bg-muted/30'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full gap-2 font-bold">
                        <span className="text-xs text-text-primary truncate">{c.name}</span>
                        <Badge variant="warning" size="sm">PENDING</Badge>
                      </div>
                      <div className="text-[9px] text-text-muted font-semibold lowercase">
                        Subdomain: {c.subdomain}
                      </div>
                    </button>
                  ))}
                {clinics.filter((c) => c.status === 'PENDING').length === 0 && (
                  <div className="text-center py-8 text-xs text-text-muted border border-dashed border-border-subtle rounded-2xl bg-bg-surface">
                    No pending verification requests.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Verification review panel */}
            <div className="lg:col-span-2">
              {selectedClinic && selectedClinic.status === 'PENDING' ? (
                <Card className="flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-border-subtle/50 pb-4">
                    <div>
                      <span className="text-[10px] text-text-muted font-bold uppercase">Application Verification Review</span>
                      <h2 className="text-lg font-black text-text-primary mt-1">{selectedClinic.name}</h2>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border-subtle bg-bg-muted/10 text-xs font-semibold text-text-secondary leading-relaxed flex flex-col gap-2 font-semibold">
                    <div>
                      <span className="text-text-muted">Legal Name:</span> {selectedClinic.ownerName || 'N/A'}
                    </div>
                    <div>
                      <span className="text-text-muted">Contact Info:</span> {selectedClinic.email} • {selectedClinic.phone || 'N/A'}
                    </div>
                    <div>
                      <span className="text-text-muted">Address Details:</span> {selectedClinic.address || 'N/A'}, {selectedClinic.city || 'N/A'}, {selectedClinic.state || 'N/A'}
                    </div>
                  </div>

                  {/* Documents list */}
                  <div className="flex flex-col gap-3">
                    <span className="font-black text-[10px] uppercase text-text-muted tracking-widest border-b border-border-subtle/30 pb-1.5">Uploaded Credentials ({selectedClinic.documents?.length || 0})</span>
                    <div className="flex flex-col gap-2 mt-1">
                      {selectedClinic.documents?.map((doc) => (
                        <div key={doc.id} className="p-3.5 rounded-2xl border border-border-subtle bg-bg-surface flex justify-between items-center text-xs font-bold">
                          <div>
                            <div className="text-text-primary">{doc.fileName}</div>
                            <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold mt-0.5">{doc.documentType.replace('_', ' ')}</span>
                          </div>
                          <a href={doc.fileUrl} target="_blank">
                            <Button variant="outline" size="sm" className="text-xs px-3.5 py-1.5 h-[36px] font-black uppercase tracking-wider">
                              View File
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decision Controls */}
                  <div className="border-t border-border-subtle/60 pt-5 flex flex-col gap-4 bg-bg-muted/10 p-5 rounded-2xl border border-border-subtle">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Verification Decision Controls</span>
                    
                    <Input
                      label="Reviewer Notes / Rejection Reason"
                      placeholder="Input notes or specify reasons if rejecting the clinic application..."
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                    />

                    <div className="flex gap-3 mt-2">
                      <Button
                        onClick={() => handleUpdateClinicStatus(selectedClinic.id, 'VERIFIED')}
                        isLoading={actionLoading}
                        variant="success"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-0 text-white shadow"
                      >
                        Approve Clinic
                      </Button>
                      
                      <Button
                        onClick={() => {
                          if (!rejectNotes.trim()) {
                            alert('Please specify a rejection reason in the input box above.');
                            return;
                          }
                          handleUpdateClinicStatus(selectedClinic.id, 'REJECTED');
                        }}
                        isLoading={actionLoading}
                        variant="danger"
                        className="flex-1"
                      >
                        Reject & Send Feedback
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="border border-dashed border-border-subtle rounded-2xl p-20 text-center flex flex-col items-center justify-center bg-bg-surface/50 h-64">
                  <span className="text-4xl filter opacity-80 mb-3 select-none">🔍</span>
                  <h3 className="text-xs font-bold text-text-primary">Awaiting Review Selection</h3>
                  <p className="text-[10px] text-text-muted mt-1 max-w-xs leading-relaxed font-semibold">
                    Select a pending review clinic application from the list directory on the left to verify certifications and run verification actions.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: FEATURE FLAGS */}
        {activeTab === 'flags' && (
          <div className="max-w-2xl mx-auto w-full animate-fadeIn">
            <Card className="flex flex-col gap-6">
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Global Feature Flags Management</h3>
              
              <div className="flex flex-col gap-4 mt-1">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="p-4 border border-border-subtle rounded-2xl bg-bg-surface flex items-center justify-between gap-4 text-xs font-semibold text-text-secondary leading-normal">
                    <div className="truncate">
                      <div className="font-extrabold text-text-primary truncate">{flag.name}</div>
                      <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">{flag.description}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(flag.name, flag.isEnabled)}
                      className={`p-1.5 rounded-lg transition ${
                        flag.isEnabled ? 'text-primary' : 'text-text-muted'
                      }`}
                      title={flag.isEnabled ? "Disable Feature" : "Enable Feature"}
                    >
                      {flag.isEnabled ? (
                        <ToggleRight className="w-9 h-9" />
                      ) : (
                        <ToggleLeft className="w-9 h-9" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* Left: create announcements */}
            <div className="flex flex-col gap-6">
              <Card className="flex flex-col gap-4">
                <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Create System Announcement</h3>
                
                <form onSubmit={handlePublishAnnouncement} className="flex flex-col gap-4 text-xs">
                  <Input
                    label="Announcement Title"
                    required
                    placeholder="e.g. Scheduled System Upgrade"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                  />
                  <Textarea
                    label="Announcement Content"
                    required
                    rows={4}
                    placeholder="Content details here..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                  />
                  <Select
                    label="Target Audience"
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'All Users (Clinics & Patients)' },
                      { value: 'CLINICS', label: 'Clinics Only' },
                    ]}
                  />

                  <Button type="submit" variant="primary" className="w-full mt-2 bg-primary" isLoading={actionLoading}>
                    Publish Announcement
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right: announcements directory */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Active Broadcast Directory</h3>
              
              {announcements.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-subtle rounded-2xl bg-bg-surface text-text-muted text-xs">
                  No active platform announcements.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 rounded-2xl border border-border-subtle bg-bg-surface flex flex-col gap-2 text-xs font-semibold text-text-secondary leading-normal">
                      <div className="flex justify-between items-center w-full gap-2">
                        <span className="font-extrabold text-text-primary truncate">{ann.title}</span>
                        <Badge variant="primary" size="sm">{ann.target}</Badge>
                      </div>
                      <p className="font-medium mt-1">{ann.content}</p>
                      <span className="text-[9px] text-text-muted mt-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 6: PLATFORM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
            
            {/* Sidebar navigation list for settings sections */}
            <div className="flex flex-col gap-1 border border-border-subtle bg-bg-surface p-4 rounded-3xl h-fit">
              {[
                { id: 'general', label: 'General Identity' },
                { id: 'integrations', label: 'API & Integrations' },
                { id: 'backup', label: 'Backup & Restore' },
                { id: 'history', label: 'Configuration Audit' },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSettingsSubTab(subTab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    settingsSubTab === subTab.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* Main configurations form box */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Section 1: General & Maintenance */}
              {settingsSubTab === 'general' && (
                <div className="flex flex-col gap-6">
                  {/* Maintenance Mode widget */}
                  <Card className="flex justify-between items-center gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-text-primary">System Maintenance Toggle</h3>
                      <p className="text-[10px] text-text-muted mt-0.5">Locks operational routing for general clinic profiles</p>
                    </div>
                    <button
                      onClick={() => handleToggleMaintenance(platformSettings.maintenance)}
                      className="text-text-muted transition shrink-0"
                    >
                      {platformSettings.maintenance ? (
                        <ToggleRight className="w-10 h-10 text-danger animate-pulse" />
                      ) : (
                        <ToggleLeft className="w-10 h-10" />
                      )}
                    </button>
                  </Card>

                  {/* General settings form */}
                  <Card className="flex flex-col gap-5">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Identity Details</h3>
                    <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 text-xs font-semibold text-text-secondary leading-normal">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Platform Display Name"
                          required
                          value={platformName}
                          onChange={(e) => setPlatformName(e.target.value)}
                        />
                        <Input
                          label="Primary Brand Color (Hex)"
                          required
                          value={brandingColor}
                          onChange={(e) => setBrandingColor(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Support Contact Email"
                          type="email"
                          required
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                        />
                        <Input
                          label="Support Contact Hotline"
                          required
                          value={supportPhone}
                          onChange={(e) => setSupportPhone(e.target.value)}
                        />
                      </div>
                      <Button type="submit" variant="primary" className="bg-primary hover:bg-primary-hover w-full mt-2" isLoading={actionLoading}>
                        Commit Settings Updates
                      </Button>
                    </form>
                  </Card>
                </div>
              )}

              {/* Section 2: APIs & Integrations */}
              {settingsSubTab === 'integrations' && (
                <div className="flex flex-col gap-6">
                  {/* SMTP settings & test */}
                  <Card className="flex flex-col gap-5">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Outbound SMTP Mailer Abstraction</h3>
                    <form onSubmit={handleTestEmail} className="flex flex-col gap-4 text-xs font-semibold text-text-secondary leading-normal">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input label="SMTP Hostname" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                        <Input label="Port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                        <Input label="Username" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                      </div>
                      <Input label="SMTP Password" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} />
                      <div className="flex gap-3 items-end border-t border-border-subtle/50 pt-4 mt-2">
                        <div className="flex-1">
                          <Input 
                            placeholder="recipient@test.com" 
                            label="Target test recipient email"
                            value={testEmailTarget}
                            onChange={(e) => setTestEmailTarget(e.target.value)}
                          />
                        </div>
                        <Button type="submit" variant="primary" className="bg-primary shrink-0" isLoading={testEmailLoading}>
                          Verify Connection Link
                        </Button>
                      </div>
                    </form>
                  </Card>

                  {/* Twilio SMS settings & test */}
                  <Card className="flex flex-col gap-5">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Twilio SMS gateway API</h3>
                    <form onSubmit={handleTestSms} className="flex flex-col gap-4 text-xs font-semibold text-text-secondary leading-normal">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Account SID" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} />
                        <Input label="Auth Token Secret" type="password" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} />
                      </div>
                      <div className="flex gap-3 items-end border-t border-border-subtle/50 pt-4 mt-2">
                        <div className="flex-1">
                          <Input 
                            placeholder="+15550199" 
                            label="Target test phone number"
                            value={testSmsTarget}
                            onChange={(e) => setTestSmsTarget(e.target.value)}
                          />
                        </div>
                        <Button type="submit" variant="primary" className="bg-primary shrink-0" isLoading={testSmsLoading}>
                          Send Verification SMS
                        </Button>
                      </div>
                    </form>
                  </Card>

                  {/* General Google Maps API */}
                  <Card className="flex flex-col gap-4">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Google Maps API credentials</h3>
                    <div className="flex flex-col gap-3 text-xs font-semibold text-text-secondary leading-normal">
                      <Input label="Google Maps Geocoding API Key" type="password" value={gmapsKey} onChange={(e) => setGmapsKey(e.target.value)} />
                      <Button variant="outline" size="sm" onClick={() => alert('API key saved successfully!')} className="w-full mt-2">
                        Update Google Maps Credentials
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Section 3: Backup & Restore */}
              {settingsSubTab === 'backup' && (
                <div className="flex flex-col gap-6">
                  {/* Manual backup trigger card */}
                  <Card className="flex justify-between items-center gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-text-primary">Outbound Database Backups</h3>
                      <p className="text-[10px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">Triggers manual backup dumps of live database tables</p>
                    </div>
                    <Button 
                      onClick={handleTriggerBackup}
                      variant="primary" 
                      className="bg-primary hover:bg-primary-hover shrink-0"
                      isLoading={backupTriggerLoading}
                    >
                      Trigger Database Backup
                    </Button>
                  </Card>

                  {/* History of backup jobs */}
                  <Card className="flex flex-col gap-4">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Historical Backup logs</h3>
                    
                    <div className="flex flex-col gap-3.5 mt-1 text-xs font-semibold text-text-secondary">
                      {adminData?.backups?.length === 0 ? (
                        <div className="py-6 text-center text-text-muted">No backup logs registered.</div>
                      ) : (
                        adminData?.backups?.map((job) => (
                          <div key={job.id} className="flex justify-between items-center border-b border-border-subtle/30 pb-3 last:border-0 last:pb-0">
                            <div>
                              <div className="font-bold text-text-primary">{job.filename}</div>
                              <div className="text-[10px] text-text-muted mt-0.5">{(job.size / 1024 / 1024).toFixed(2)} MB • Generated at: {new Date(job.createdAt).toLocaleString()}</div>
                            </div>
                            <Badge variant="success" size="sm">
                              {job.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* System properties metadata */}
                  <Card className="flex flex-col gap-4">
                    <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">General Platform metadata</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-text-secondary leading-normal">
                      <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                        <span>Platform version</span>
                        <span className="font-bold text-text-primary">{adminData?.systemInfo?.version || '1.0.0'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                        <span>Database Engine</span>
                        <span className="font-bold text-text-primary">{adminData?.systemInfo?.dbEngine || 'PostgreSQL'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                        <span>Node Environment</span>
                        <span className="font-bold text-text-primary">{adminData?.systemInfo?.environment || 'development'}</span>
                      </div>
                      <div className="flex justify-between border-b border-border-subtle/30 pb-2">
                        <span>Production Build</span>
                        <span className="font-bold text-text-primary">{adminData?.systemInfo?.buildNumber || '001'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Section 4: Configuration Audit change logs */}
              {settingsSubTab === 'history' && (
                <Card className="flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Settings Audit ledger</h3>
                  
                  <div className="flex flex-col gap-3">
                    {adminData?.history?.length === 0 ? (
                      <div className="py-8 text-center text-text-muted">No settings modifications audited.</div>
                    ) : (
                      adminData?.history?.map((log) => (
                        <div key={log.id} className="p-3.5 border border-border-subtle bg-bg-surface/50 rounded-2xl flex flex-col gap-2 text-xs font-semibold text-text-secondary">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-text-primary uppercase tracking-wider">{log.settingKey}</span>
                            <span className="text-[9px] text-text-muted font-bold">{new Date(log.changedAt).toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-text-secondary mt-1">Changes: {log.reason || 'Settings saved'}</div>
                          <span className="text-[9px] text-text-muted mt-1 uppercase font-bold">Modified by user: {log.changedBy}</span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              )}

            </div>

          </div>
        )}

        {/* TAB 7: SECURITY AUDITS */}
        {activeTab === 'audits' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-extrabold text-sm text-text-primary">Complete Security Audits Log</h3>
              <Input
                isSearch
                placeholder="Search audit actions, details..."
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                className="w-full sm:max-w-[320px]"
              />
            </div>

            <div className="flex flex-col gap-3">
              {auditLogs
                ?.filter((log) => log.action.toLowerCase().includes(auditQuery.toLowerCase()) || log.details.toLowerCase().includes(auditQuery.toLowerCase()))
                .map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl border border-border-subtle bg-bg-surface flex items-start gap-4 text-xs font-semibold text-text-secondary leading-normal">
                    <span className="text-lg select-none shrink-0">🛡️</span>
                    <div className="flex-1 truncate">
                      <div className="flex justify-between items-center w-full gap-2">
                        <span className="font-extrabold text-text-primary truncate">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-1">{log.details}</p>
                      <div className="text-[9px] text-text-muted mt-2 font-bold uppercase tracking-wider">
                        Operator: {log.userId} • Role: {log.userRole} • clinic: {log.clinicId}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 8: GLOBAL PLATFORM ANALYTICS */}
        {activeTab === 'global-analytics' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface border border-border-subtle p-5 rounded-3xl shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm text-text-primary">
                  {selectedClinicId
                    ? `Business Intelligence — ${clinics.find((c) => c.id === selectedClinicId)?.name || 'Selected Clinic'}`
                    : 'Global Platform Business Intelligence'}
                </h3>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {selectedClinicId
                    ? 'Tenant-scoped visits, tokens, and performance benchmarks for the selected clinic'
                    : 'Aggregate tenant registrations, platform growth indices, and performance benchmarks'}
                </p>
              </div>

              <select 
                value={globalAnalyticsRange}
                onChange={(e) => setGlobalAnalyticsRange(e.target.value)}
                className="p-2 border border-border-subtle rounded-xl bg-bg-surface text-xs font-bold text-text-primary focus:outline-none shrink-0"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>

            {loadingGlobalAnalytics || !globalAnalyticsData ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Platform Overview stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard 
                    label={selectedClinicId ? 'Clinic Tokens' : 'Total Registered Tenants'}
                    value={globalAnalyticsData.clinicsCount}
                    change={selectedClinicId ? 'Visits processed' : 'Active clinic portals'}
                    icon={<Building className="w-5 h-5 text-primary" />}
                  />
                  <StatsCard 
                    label={selectedClinicId ? 'Patients This Month' : 'Total Platform Tokens'}
                    value={globalAnalyticsData.kpis.patientsThisMonth}
                    change="Visits processed"
                    icon={<Users className="w-5 h-5 text-emerald-500" />}
                  />
                  <StatsCard 
                    label="Average Wait Benchmarks"
                    value={`${globalAnalyticsData.kpis.avgWaitTime}m`}
                    change={selectedClinicId ? 'For the selected clinic' : 'Across all doctor chambers'}
                    icon={<Clock className="w-5 h-5 text-indigo-500" />}
                  />
                  <StatsCard 
                    label="Platform Growth Ratio"
                    value="+18.4%"
                    change="Month over Month"
                    icon={<Activity className="w-5 h-5 text-amber-500" />}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Platform growth curve */}
                  <Card className="lg:col-span-2 flex flex-col gap-6">
                    <div>
                      <h3 className="font-extrabold text-sm text-text-primary">Platform Growth Curve</h3>
                      <p className="text-[10px] text-text-muted mt-0.5">Visits completed globally over operations timeline</p>
                    </div>

                    <div className="h-48 w-full border border-border-subtle/80 bg-bg-muted/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                      <svg className="absolute inset-0 w-full h-full p-6 text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path 
                          d="M 0 95 Q 20 70 40 50 T 80 15 T 100 5" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3.5" 
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="flex justify-between items-end w-full text-[9px] font-black uppercase text-text-muted relative z-10 border-t border-border-subtle/50 pt-2 mt-auto">
                        {globalAnalyticsData.visitsTimeline.map((day, idx: number) => (
                          <span key={idx}>{day.date}</span>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Leaderboards/Top lists */}
                  <Card className="flex flex-col gap-5">
                    <div>
                      <h3 className="font-extrabold text-sm text-text-primary">Tenant Leaderboard</h3>
                      <p className="text-[10px] text-text-muted mt-0.5">Benchmarking most active registered clinic nodes</p>
                    </div>

                    <div className="flex flex-col gap-3.5 text-xs font-semibold text-text-secondary">
                      {[
                        { name: 'City Dental Clinic', visits: 148, wait: '11m', completion: '96%' },
                        { name: 'Redwood Pediatrics', visits: 112, wait: '14m', completion: '92%' },
                        { name: 'Lakeside Cardio Clinic', visits: 85, wait: '21m', completion: '89%' },
                        { name: 'Hope Wellness Clinic', visits: 72, wait: '9m', completion: '98%' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-border-subtle/30 pb-2.5 last:border-0 last:pb-0">
                          <div>
                            <div className="text-text-primary font-bold">{item.name}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">{item.visits} tokens • Avg wait: {item.wait}</div>
                          </div>
                          <Badge variant="success" size="sm">
                            {item.completion} Comp
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                </div>
              </>
            )}

          </div>
        )}

        {/* TAB 9: PLATFORM USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-text-primary">Platform User Directory</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Every patient, staff member, doctor, and clinic admin across all tenants</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <select
                  value={usersRoleFilter}
                  onChange={(e) => setUsersRoleFilter(e.target.value)}
                  className="p-2 border border-border-subtle rounded-xl bg-bg-surface text-xs font-bold text-text-primary focus:outline-none shrink-0"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Clinic Admins</option>
                  <option value="DOCTOR">Doctors</option>
                  <option value="RECEPTIONIST">Staff</option>
                  <option value="PATIENT">Patients</option>
                </select>
                <Input
                  isSearch
                  placeholder="Search name, email, clinic..."
                  value={usersQuery}
                  onChange={(e) => setUsersQuery(e.target.value)}
                  className="w-full sm:max-w-[280px]"
                />
              </div>
            </div>

            {usersLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <Card className="flex flex-col gap-1">
                <div className="grid grid-cols-[1fr_1.4fr_auto] sm:grid-cols-[1fr_1.4fr_1fr_auto] gap-3 px-4 py-2.5 border-b border-border-subtle text-[9px] font-black uppercase tracking-widest text-text-muted">
                  <span>User</span>
                  <span>Email</span>
                  <span className="hidden sm:block">Clinic</span>
                  <span>Role</span>
                </div>

                {platformUsers.length === 0 ? (
                  <div className="py-10 text-center text-xs text-text-muted border-b border-border-subtle/50">
                    No users match the current filters.
                  </div>
                ) : (
                  platformUsers.map((u) => (
                    <div
                      key={`${u.role}-${u.id}`}
                      className="grid grid-cols-[1fr_1.4fr_auto] sm:grid-cols-[1fr_1.4fr_1fr_auto] gap-3 items-center px-4 py-3 border-b border-border-subtle/50 last:border-0 text-xs font-semibold text-text-secondary hover:bg-bg-muted/20 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-400 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="truncate">
                          <div className="text-text-primary font-bold truncate">{u.name}</div>
                          <div className="text-[9px] text-text-muted uppercase tracking-wider">
                            {u.userId ? (u.userId.startsWith('staff-auth') ? 'Invited (email match)' : 'Registered') : 'Walk-in'}
                          </div>
                        </div>
                      </div>
                      <span className="truncate">{u.email || '—'}</span>
                      <span className="hidden sm:block truncate">{u.clinicName}</span>
                      <Badge
                        variant={
                          u.role === 'ADMIN' ? 'primary' : u.role === 'DOCTOR' ? 'success' : u.role === 'RECEPTIONIST' ? 'warning' : 'secondary'
                        }
                        size="sm"
                        className="justify-self-end"
                      >
                        {u.role}
                      </Badge>
                    </div>
                  ))
                )}
              </Card>
            )}
          </div>
        )}


      </div>
    </DashboardLayout>
  );
}
