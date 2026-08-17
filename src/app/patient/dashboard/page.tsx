'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, StatsCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { 
  Calendar, Clock, FileText, QrCode, Upload, 
  FileCheck, Activity, Plus 
} from 'lucide-react';

export default function PatientDashboard() {
  const {
    doctors,
    appointments,
    queueTokens,
    reports,
    currentUser,
    bookAppointment,
    checkInAppointment,
    uploadReport,
    currentClinic
  } = useApp();

  const [bookingDocId, setBookingDocId] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [reportFile, setReportFile] = useState<string | null>(null);
  const [reportFileObj, setReportFileObj] = useState<File | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Blood Test');
  
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Filter current patient's data
  const myAppointments = appointments.filter(a => a.patientId === currentUser?.id);
  const myActiveToken = queueTokens.find(
    t => t.patientId === currentUser?.id && ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(t.status)
  );
  
  // Calculate how many patients are ahead in line
  const patientsAhead = myActiveToken
    ? queueTokens.filter(
        t => t.doctorId === myActiveToken.doctorId && 
             t.status === 'WAITING' && 
             t.priority >= myActiveToken.priority &&
             t.id < myActiveToken.id
      ).length
    : 0;

  const activeDoctor = myActiveToken ? doctors.find(d => d.id === myActiveToken.doctorId) : null;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDocId || !bookingReason || !bookingTime) return;
    
    setBookingLoading(true);
    try {
      await bookAppointment(bookingDocId, bookingReason, new Date(bookingTime).toISOString());
      setBookingSuccess(true);
      setBookingDocId('');
      setBookingReason('');
      setBookingTime('');
      setTimeout(() => setBookingSuccess(false), 4000);
    } catch {
      alert('Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportFileObj(file);
      setReportFile(file.name);
      setReportName(file.name);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName || !reportFileObj) return;
    
    setUploadLoading(true);
    try {
      const fileExt = reportName.split('.').pop() || 'pdf';
      const type: 'pdf' | 'image' = ['jpg', 'png', 'jpeg'].includes(fileExt.toLowerCase()) ? 'image' : 'pdf';
      await uploadReport(reportFileObj, reportType, type);
      setReportFileObj(null);
      setReportFile(null);
      setReportName('');
    } catch {
      alert('Failed to upload report.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-3 py-1 rounded-full w-fit">
              Patient Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">Welcome, {currentUser?.name}!</h1>
            <p className="text-xs text-indigo-100 max-w-xl font-medium">
              Monitor your queue position, book upcoming consultations, and upload medical records securely for your physician.
            </p>
          </div>
        </div>

        {/* Live Wait Telemetry counters */}
        {myActiveToken && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatsCard
              label="Your Queue Ticket"
              value={myActiveToken.tokenNumber}
              icon={<QrCode className="w-5 h-5" />}
            />
            <StatsCard
              label="Estimated Wait"
              value={myActiveToken.status === 'IN_CONSULTATION' ? '0 mins' : `${myActiveToken.estimatedWait} mins`}
              change={`${patientsAhead} patients ahead`}
              isPositive={false}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
            />
            <StatsCard
              label="Consulting Room"
              value={activeDoctor?.roomNumber || 'Room 101'}
              change={activeDoctor?.name}
              icon={<Activity className="w-5 h-5 text-emerald-500" />}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Middle Column: Appointments list & Booking Form */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Appointments Card list */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Scheduled Appointments
              </h2>
              
              {myAppointments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-subtle rounded-xl text-text-muted text-xs">
                  No appointments scheduled. Use the form below to book one.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {myAppointments.map((appt) => (
                    <div 
                      key={appt.id} 
                      className="p-4 rounded-xl border border-border-subtle bg-bg-surface flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={appt.doctorName} size="sm" />
                        <div>
                          <div className="text-xs font-extrabold text-text-primary">{appt.doctorName}</div>
                          <div className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(appt.dateTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Badge variant={appt.status === 'SCHEDULED' ? 'primary' : 'success'}>
                          {appt.status.replace('_', ' ')}
                        </Badge>
                        
                        {appt.status === 'SCHEDULED' && !myActiveToken && (
                          <Button
                            onClick={() => checkInAppointment(appt.id)}
                            variant="primary"
                            size="sm"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Book Consultation Form */}
            <Card className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Book Consultation Slot
              </h2>
              
              {bookingSuccess && (
                <div className="p-4 rounded-xl bg-success-muted border border-success/20 text-success text-xs font-bold">
                  ✓ Consultation booked successfully! Check detail list above.
                </div>
              )}

              <form onSubmit={handleBook} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Assign Doctor"
                  required
                  value={bookingDocId}
                  onChange={(e) => setBookingDocId(e.target.value)}
                  options={[
                    { value: '', label: 'Choose Physician...' },
                    ...doctors
                      .filter(d => d.clinicId === currentClinic?.id)
                      .map(d => ({ value: d.id, label: `${d.name} (${d.specialization})` }))
                  ]}
                />
                
                <Input
                  label="Appointment Time"
                  type="datetime-local"
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Reason for Visit"
                    required
                    placeholder="e.g. Follow-up consultation, severe headache..."
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="sm:col-span-2 mt-2"
                  isLoading={bookingLoading}
                >
                  Confirm Booking
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: QR display & Uploads */}
          <div className="flex flex-col gap-8">
            
            {/* Kiosk Scanner Card */}
            <Card className="text-center flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-primary" /> Check-in Kiosk Pass
              </h3>
              
              <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto border border-border-subtle shadow-sm flex items-center justify-center relative group">
                <span className="text-7xl filter opacity-80 select-none">📱</span>
                <div className="absolute left-0 right-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 animate-pulse pointer-events-none" />
              </div>
              
              <p className="text-xs text-text-secondary leading-normal font-medium max-w-xs mx-auto">
                Scan this card at the clinic check-in kiosk tablet to automatically get added to the queue list.
              </p>
              
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-bg-muted/50 py-1.5 rounded-lg border border-border-subtle/50">
                ID: {currentUser?.id}
              </div>
            </Card>

            {/* Document upload dropzone */}
            <Card className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-primary" /> Share Medical Folders
              </h3>
              
              <form onSubmit={submitReport} className="flex flex-col gap-4">
                {reportFile ? (
                  <div className="p-4 rounded-xl border border-dashed border-success/30 bg-success-muted text-center flex flex-col gap-2">
                    <FileCheck className="w-8 h-8 text-success mx-auto" />
                    <div className="text-xs font-bold text-text-primary truncate">{reportFile}</div>
                    <button 
                      onClick={() => setReportFile(null)} 
                      type="button"
                      className="text-[10px] text-danger underline font-bold mt-1"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <label className="block p-6 rounded-xl border border-dashed border-border-subtle hover:border-primary bg-bg-muted/30 text-center cursor-pointer transition">
                    <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <span className="text-xs font-bold text-text-secondary">Drag reports or browse</span>
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                )}

                {reportFile && (
                  <>
                    <Input
                      label="File Rename"
                      required
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                    />
                    
                    <Select
                      label="Report Category"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      options={[
                        { value: 'Blood Test', label: 'Blood Panel' },
                        { value: 'X-Ray', label: 'X-Ray Scans' },
                        { value: 'MRI', label: 'MRI Scan' },
                        { value: 'CT Scan', label: 'CT Scan' },
                        { value: 'Lab Report', label: 'Laboratory Report' }
                      ]}
                    />

                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-full"
                      isLoading={uploadLoading}
                    >
                      Upload File
                    </Button>
                  </>
                )}
              </form>

              {/* Recently uploaded */}
              <div className="border-t border-border-subtle/50 pt-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Recently Shared ({reports.length})
                </span>
                <div className="flex flex-col gap-2">
                  {reports.map((rep) => (
                    <div key={rep.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl border border-border-subtle bg-bg-muted/10">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="truncate font-semibold">
                          <div className="text-text-primary truncate">{rep.fileName}</div>
                          <div className="text-[9px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">{rep.reportType}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-text-muted shrink-0">{rep.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
