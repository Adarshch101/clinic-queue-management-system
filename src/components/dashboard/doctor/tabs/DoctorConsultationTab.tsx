'use client';

import React from 'react';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { 
  SkipForward, HelpCircle, Pause, Play, 
  Clock, AlertOctagon, Check, Eye, History, FileText, 
  Activity, UserCheck, FileCheck
} from 'lucide-react';
import type { Doctor, QueueToken, Visit, MedicalReport } from '@/lib/mockData';
import type { ValidationErrors } from '@/lib/validation';

interface DoctorConsultationTabProps {
  activeToken: QueueToken | undefined;
  myDoctor: Doctor;
  diagnosis: string;
  setDiagnosis: (v: string) => void;
  prescription: string;
  setPrescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  consultErrors: ValidationErrors;
  actionLoading: boolean;
  isPaused: boolean;
  visits: Visit[];
  reports: MedicalReport[];
  previewReport: MedicalReport | null;
  setPreviewReport: (r: MedicalReport | null) => void;
  handleCallNext: () => Promise<void>;
  handleComplete: (e: React.FormEvent) => Promise<void>;
  handleSkip: () => Promise<void>;
  handleRecall: () => Promise<void>;
  handlePause: () => Promise<void>;
  handleResume: () => Promise<void>;
  handleAddDelay: () => Promise<void>;
}

export function DoctorConsultationTab({
  activeToken,
  myDoctor,
  diagnosis,
  setDiagnosis,
  prescription,
  setPrescription,
  notes,
  setNotes,
  consultErrors,
  actionLoading,
  isPaused,
  visits,
  reports,
  previewReport,
  setPreviewReport,
  handleCallNext,
  handleComplete,
  handleSkip,
  handleRecall,
  handlePause,
  handleResume,
  handleAddDelay,
}: DoctorConsultationTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Left Column: Active Patient Consultation Suite */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Active Patient Call Banner */}
        <Card className={`flex flex-col gap-6 p-6 transition ${activeToken ? 'border-primary shadow-lg shadow-primary/5 bg-bg-surface' : 'border-border-subtle'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle pb-4">
            <div>
              <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Consultation Suite • Room {myDoctor.roomNumber || '101'}
              </div>
              <h2 className="text-xl font-black text-text-primary tracking-tight mt-1">
                {activeToken ? `Active Patient: ${activeToken.patientName}` : 'No Active Consultation in Room'}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isPaused ? (
                <Chip
                  label="Queue Paused"
                  size="small"
                  color="warning"
                  variant="outlined"
                  icon={<Pause className="w-3.5 h-3.5" />}
                />
              ) : (
                <Chip
                  label="Available for Call"
                  size="small"
                  color="success"
                  icon={<Check className="w-3.5 h-3.5" />}
                />
              )}
            </div>
          </div>

          {activeToken ? (
            <div className="flex flex-col gap-6">
              {/* Token Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-bg-muted/40 border border-border-subtle">
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase">Token Number</div>
                  <div className="text-2xl font-black text-primary tracking-tight mt-0.5">{activeToken.tokenNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase">Age & Gender</div>
                  <div className="text-sm font-bold text-text-primary mt-1">
                    {activeToken.patientAge ? `${activeToken.patientAge} yrs` : 'N/A'} • {activeToken.patientGender || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase">Priority Status</div>
                  <div className="mt-1">
                    {activeToken.isEmergency ? (
                      <Badge variant="danger" className="text-[10px]">
                        <AlertOctagon className="w-3 h-3 shrink-0" /> EMERGENCY
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Standard Queue
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted font-bold uppercase">Reason for Visit</div>
                  <div className="text-xs font-semibold text-text-primary mt-1 truncate" title={activeToken.reason}>
                    {activeToken.reason}
                  </div>
                </div>
              </div>

              {/* Consultation Record Form */}
              <form onSubmit={handleComplete} className="flex flex-col gap-5 border-t border-border-subtle pt-5">
                <h3 className="font-black text-sm text-text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Clinical Consultation Entry & Prescriptions
                </h3>

                <Textarea
                  label="Diagnosis & Clinical Findings"
                  required
                  placeholder="Enter clinical examination notes, primary diagnosis, and findings..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  error={consultErrors.diagnosis || undefined}
                  rows={3}
                />

                <Textarea
                  label="Prescription & Dosage Details"
                  placeholder="e.g. Paracetamol 500mg (1-0-1 after meals for 5 days)..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={3}
                />

                <Textarea
                  label="Private Clinical Notes (Internal Only)"
                  placeholder="Internal notes for follow-up or lab referral..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex gap-2">
                    <Tooltip title="Skip active patient and call next in queue">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSkip}
                        isLoading={actionLoading}
                      >
                        <SkipForward className="w-4 h-4" /> Skip Patient
                      </Button>
                    </Tooltip>
                    <Tooltip title="Re-issue call alert to patient waiting room">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleRecall}
                        isLoading={actionLoading}
                      >
                        <HelpCircle className="w-4 h-4" /> Recall Call Alert
                      </Button>
                    </Tooltip>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black"
                    isLoading={actionLoading}
                  >
                    <Check className="w-4 h-4" /> Complete Consultation & Discharge
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-4 bg-bg-muted/20 rounded-2xl border border-dashed border-border-subtle">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-text-primary">Ready for Next Consultation</h3>
                <p className="text-xs text-text-secondary mt-1">Press Call Next Patient to fetch the highest priority waiting patient.</p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCallNext}
                isLoading={actionLoading}
                className="mt-2"
              >
                Call Next Patient
              </Button>
            </div>
          )}
        </Card>

        {/* Patient History & Medical Reports Section */}
        {activeToken && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Previous Visit History Timeline */}
            <Card className="flex flex-col gap-4 p-5">
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle pb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Previous Consultations ({visits.length})
              </h3>
              {visits.length === 0 ? (
                <div className="text-xs text-text-muted py-6 text-center">No prior visit history recorded.</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {visits.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl border border-border-subtle bg-bg-muted/20 text-xs flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] font-black text-text-muted uppercase">
                        <span>{v.date}</span>
                        <span className="text-primary">{v.doctorName}</span>
                      </div>
                      <div className="font-bold text-text-primary mt-0.5">Diagnosis: {v.diagnosis}</div>
                      {v.prescription && <div className="text-text-secondary text-[11px]">Rx: {v.prescription}</div>}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Medical Documents & Lab Reports */}
            <Card className="flex flex-col gap-4 p-5">
              <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle pb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-500" />
                Uploaded Patient Reports ({reports.length})
              </h3>
              {reports.length === 0 ? (
                <div className="text-xs text-text-muted py-6 text-center">No uploaded lab documents.</div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {reports.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="truncate">
                          <div className="font-bold text-text-primary truncate">{r.fileName}</div>
                          <div className="text-[10px] text-text-muted">{r.reportType} • {r.uploadedAt}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewReport(r)}
                        className="shrink-0 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Right Column: Room Operational Controls & Quick Stats */}
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5">
          <h3 className="font-extrabold text-sm text-text-primary border-b border-border-subtle pb-3">
            Room Operational Toggles
          </h3>

          <div className="flex flex-col gap-3">
            {isPaused ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleResume}
                isLoading={actionLoading}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="w-4 h-4" /> Resume Queue Reception
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handlePause}
                isLoading={actionLoading}
                className="w-full justify-center border-warning text-warning hover:bg-warning-muted"
              >
                <Pause className="w-4 h-4" /> Pause Consultation Queue
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={handleAddDelay}
              isLoading={actionLoading}
              className="w-full justify-center"
            >
              <Clock className="w-4 h-4" /> Broadcast +10m Consultation Delay
            </Button>
          </div>
        </Card>

        {/* Room Info Stats */}
        <div className="grid grid-cols-1 gap-4">
          <StatsCard
            label="Assigned Consultation Room"
            value={`Room ${myDoctor.roomNumber || '101'}`}
            change={myDoctor.specialization}
            icon={<Activity className="w-5 h-5 text-primary" />}
          />
          <StatsCard
            label="Average Consult Duration"
            value={`${myDoctor.averageConsultationTime || 12} mins`}
            change="Configured slot time"
            icon={<Clock className="w-5 h-5 text-indigo-500" />}
          />
        </div>
      </div>

      {/* Medical Report Preview Overlay Modal */}
      {previewReport && (
        <Dialog
          isOpen={!!previewReport}
          onClose={() => setPreviewReport(null)}
          title={`Medical Report: ${previewReport.fileName}`}
          description={`${previewReport.reportType} uploaded on ${previewReport.uploadedAt}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setPreviewReport(null)}>
              Close Document
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-bg-muted/40 border border-border-subtle text-xs space-y-1">
              <div><span className="font-bold text-text-primary">File Name:</span> {previewReport.fileName}</div>
              <div><span className="font-bold text-text-primary">Document Type:</span> {previewReport.reportType}</div>
              <div><span className="font-bold text-text-primary">Uploaded Date:</span> {previewReport.uploadedAt}</div>
            </div>

            {previewReport.fileType === 'pdf' ? (
              <div className="py-8 text-center text-xs text-text-primary bg-bg-muted/20 rounded-xl font-bold flex flex-col items-center justify-center gap-2">
                <FileText className="w-10 h-10 text-primary" />
                <span>Simulated Lab Document (PDF Viewer)</span>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-primary bg-bg-muted/20 rounded-xl font-bold flex flex-col items-center justify-center gap-2">
                <span className="text-4xl">🩻</span>
                <span>Simulated Radiology Scan Image</span>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
