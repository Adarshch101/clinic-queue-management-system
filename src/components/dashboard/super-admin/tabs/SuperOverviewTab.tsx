'use client';

import React from 'react';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Activity, Clock, CheckCircle2, Ban, Building, Users } from 'lucide-react';

interface SuperStats {
  totalClinics: number;
  verifiedClinics: number;
  pendingClinics: number;
  servedTokens: number;
  suspendedClinics: number;
}

interface SuperClinic {
  id: string;
  name: string;
}

interface SuperAuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
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

interface SuperOverviewTabProps {
  selectedClinicId: string;
  setSelectedClinicId: (id: string) => void;
  clinicScopeStats: ClinicScopeStats | null;
  clinicScopeLoading: boolean;
  clinics: SuperClinic[];
  stats: SuperStats;
  setActiveTab: (tab: string) => void;
}

export function SuperOverviewTab({
  selectedClinicId,
  setSelectedClinicId,
  clinicScopeStats,
  clinicScopeLoading,
  clinics,
  stats,
  setActiveTab,
}: SuperOverviewTabProps) {
  if (selectedClinicId && clinicScopeStats) {
    return (
      <div className="flex flex-col gap-8 animate-fadeIn">
        {/* Deep-dive header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-text-primary">
              Clinic Deep-Dive: {clinics.find((c) => c.id === selectedClinicId)?.name || 'Selected Clinic'}
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              Live operational intelligence for the selected tenant — tokens, staffing, and recent activity
            </p>
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
                <span className="text-[10px] text-text-secondary font-semibold">
                  {clinicScopeStats.staff.admins.map((a) => a.name).join(', ') || '—'}
                </span>
              </div>
              <div className="p-4 border border-border-subtle rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Receptionists</span>
                <span className="text-2xl font-extrabold">{clinicScopeStats.staff.receptionists.length}</span>
                <span className="text-[10px] text-text-secondary font-semibold">
                  {clinicScopeStats.staff.receptionists.map((a) => a.name).join(', ') || '—'}
                </span>
              </div>
              <div className="p-4 border border-border-subtle rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Doctors</span>
                <span className="text-2xl font-extrabold">{clinicScopeStats.staff.doctors.length}</span>
                <span className="text-[10px] text-text-secondary font-semibold">
                  {clinicScopeStats.staff.doctors.map((a) => a.name).join(', ') || '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Queue efficiency benchmarks */}
          <Card className="flex flex-col gap-4">
            <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">
              Queue Efficiency Benchmarks
            </h3>
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
                    : 0}
                  %
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
    );
  }

  if (selectedClinicId && (clinicScopeLoading || !clinicScopeStats)) {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-bg-muted animate-pulse" />
          ))}
        </div>
        <p className="text-xs font-bold text-text-muted animate-pulse">Loading clinic intelligence...</p>
      </div>
    );
  }

  return (
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
          change="Access restricted"
          icon={<Ban className="w-5 h-5 text-danger" />}
        />
      </div>

      {/* Quick shortcuts */}
      <Card className="flex flex-col gap-4">
        <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle/50 pb-3">Platform Administration Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Clinics Directory', tab: 'clinics', icon: '🏥' },
            { label: 'Platform Users', tab: 'users', icon: '👥' },
            { label: 'Feature Flags', tab: 'system-flags', icon: '🚩' },
            { label: 'Audit Trail', tab: 'audit-trail', icon: '📜' },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className="p-4 border border-border-subtle rounded-2xl bg-bg-surface hover:bg-bg-muted/40 transition text-left flex flex-col gap-2"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-extrabold text-text-primary">{item.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
