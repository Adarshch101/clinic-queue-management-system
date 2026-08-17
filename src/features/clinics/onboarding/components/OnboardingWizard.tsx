'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateOnboardingStep } from '../validators/onboardingValidators';
import { ProfilePreview } from './ProfilePreview';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  Building, Phone, MapPin, Users, Heart, Clock, 
  Upload, Settings, Eye, CheckCircle2, ChevronLeft, 
  ChevronRight, Trash2, ShieldCheck, AlertCircle 
} from 'lucide-react';

interface OnboardingWizardProps {
  clinicId: string;
}

interface OnboardingDoctor {
  name: string;
  qualification?: string;
  specialization: string;
  experience?: number;
  registrationNumber: string;
  consultationFee?: number;
  consultationDuration?: number;
  languages?: string;
  bio?: string;
}

interface OnboardingDocument {
  id: string;
  fileName: string;
  documentType: string;
}

interface OnboardingFormData {
  clinicName: string;
  legalBusinessName: string;
  logoUrl: string;
  bannerUrl: string;
  tagline: string;
  description: string;
  establishedYear: number;
  clinicType: string;
  primaryEmail: string;
  primaryPhone: string;
  emergencyPhone: string;
  website: string;
  supportEmail: string;
  whatsappNumber: string;
  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  pincode: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  doctors: OnboardingDoctor[];
  services: string;
  workingDays: string[];
  openingTime: string;
  closingTime: string;
  lunchBreak: string;
  averageConsultationTime: number;
  maxQueueSize: number;
  documents: OnboardingDocument[];
  tokenPrefix: string;
  maxDailyTokens: number;
  timezone: string;
  language: string;
  queueEnabled: boolean;
  appointmentsEnabled: boolean;
  walkInPatients: boolean;
  emergencyQueue: boolean;
  publicProfileVisibility: boolean;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ clinicId }) => {
  const router = useRouter();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Form Fields State (consolidated for easy serializing/autosaving)
  const [formData, setFormData] = useState<OnboardingFormData>({
    // Step 1
    clinicName: '',
    legalBusinessName: '',
    logoUrl: '🏥',
    bannerUrl: '',
    tagline: '',
    description: '',
    establishedYear: 2020,
    clinicType: 'Multi Doctor',
    
    // Step 2
    primaryEmail: '',
    primaryPhone: '',
    emergencyPhone: '',
    website: '',
    supportEmail: '',
    whatsappNumber: '',
    
    // Step 3
    country: 'United States',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    pincode: '',
    latitude: 0.0,
    longitude: 0.0,
    googleMapsUrl: '',
    
    // Step 4
    doctors: [],
    
    // Step 5
    services: 'General Physician, Pediatrics, Dental',
    
    // Step 6
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    openingTime: '09:00 AM',
    closingTime: '05:00 PM',
    lunchBreak: '01:00 PM - 02:00 PM',
    averageConsultationTime: 15,
    maxQueueSize: 50,
    
    // Step 7
    documents: [],
    
    // Step 8
    tokenPrefix: 'T',
    maxDailyTokens: 100,
    timezone: 'EST',
    language: 'en',
    queueEnabled: true,
    appointmentsEnabled: true,
    walkInPatients: true,
    emergencyQueue: true,
    publicProfileVisibility: true,
  });

  // Doctor Form Fields (for Step 4 additions)
  const [docName, setDocName] = useState('');
  const [docQual, setDocQual] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docExp, setDocExp] = useState('');
  const [docRegNum, setDocRegNum] = useState('');
  const [docFee, setDocFee] = useState('50');

  // Document Upload States
  const [selectedDocType, setSelectedDocType] = useState('MEDICAL_LICENSE');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // 1. Fetch Draft from PostgreSQL database on mount
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await fetch(`/api/onboarding/draft?clinicId=${clinicId}`);
        if (res.ok) {
          const draft = await res.json();
          if (draft && draft.stepData) {
            setFormData(draft.stepData);
          }
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      } finally {
        setLoadingDraft(false);
      }
    };
    fetchDraft();
  }, [clinicId]);

  // 2. Autosave triggers on data modification
  const triggerAutosave = async (updatedData: OnboardingFormData) => {
    setSavingStatus('saving');
    try {
      const res = await fetch('/api/onboarding/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, stepData: updatedData }),
      });
      if (res.ok) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2500);
      } else {
        setSavingStatus('error');
      }
    } catch {
      setSavingStatus('error');
    }
  };

  const handleFieldChange = (field: string, value: unknown) => {
    const updated = { ...formData, [field]: value } as OnboardingFormData;
    setFormData(updated);
    triggerAutosave(updated);
  };

  // Add doctor to Step 4
  const handleAddDoctor = () => {
    if (!docName || !docSpec || !docRegNum) {
      alert('Please fill out Name, Specialization, and Registration Number.');
      return;
    }
    const newDoc = {
      name: docName,
      qualification: docQual,
      specialization: docSpec,
      experience: parseInt(docExp) || 5,
      registrationNumber: docRegNum,
      consultationFee: parseFloat(docFee) || 50,
      consultationDuration: formData.averageConsultationTime,
      languages: 'English',
      bio: '',
    };
    const updatedDocs = [...formData.doctors, newDoc];
    handleFieldChange('doctors', updatedDocs);

    // Reset doc fields
    setDocName('');
    setDocQual('');
    setDocSpec('');
    setDocExp('');
    setDocRegNum('');
  };

  const handleRemoveDoctor = (idx: number) => {
    const updatedDocs = formData.doctors.filter((_, i) => i !== idx);
    handleFieldChange('doctors', updatedDocs);
  };

  // Document management handlers (Step 7)
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB max
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    setUploadProgress(20);
    try {
      const formDataObj = new FormData();
      formDataObj.append('clinicId', clinicId);
      formDataObj.append('documentType', selectedDocType);
      formDataObj.append('file', file);

      setUploadProgress(60);
      const res = await fetch('/api/onboarding/upload', {
        method: 'POST',
        body: formDataObj,
      });

      if (!res.ok) throw new Error('Upload error');
      const docRecord = await res.json();
      
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1000);

      const updatedDocs = [...formData.documents, docRecord];
      handleFieldChange('documents', updatedDocs);
    } catch {
      alert('Upload failed. Check connections.');
      setUploadProgress(null);
    }
  };

  const handleRemoveDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/onboarding/upload?clinicId=${clinicId}&documentId=${docId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const updatedDocs = formData.documents.filter((d) => d.id !== docId);
        handleFieldChange('documents', updatedDocs);
      }
    } catch {
      alert('Failed to delete document.');
    }
  };

  // Step transitions
  const handleNext = () => {
    setValidationErrors([]);
    const errors = validateOnboardingStep(currentStep, formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (currentStep < 9) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setValidationErrors([]);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit onboarding to review API
  const handleSubmitReview = async () => {
    // Run validation checks on ALL steps before final submission
    let allErrors: string[] = [];
    for (let step = 1; step <= 8; step++) {
      allErrors = [...allErrors, ...validateOnboardingStep(step, formData)];
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      alert('Onboarding has validation warnings. Review all steps before submitting.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/onboarding/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, action: 'SUBMIT' }),
      });
      
      if (!res.ok) {
        throw new Error('Submit failed');
      }

      setSubmitSuccess(true);
    } catch {
      alert('Failed to submit onboarding files.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loadingDraft) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 text-xs text-text-secondary">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span>Loading onboarding profile data...</span>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full bg-success-muted border border-success/20 text-success flex items-center justify-center shadow-sm shrink-0">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Onboarding Submitted!</h1>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-semibold">
            Thank you! Your clinic profile and credentials are submitted to our administration reviews queue. We will verify your licenses shortly.
          </p>
        </div>
        <Button onClick={() => router.push('/')} variant="primary">
          Return to Homepage
        </Button>
      </div>
    );
  }

  const stepPercentage = Math.round((currentStep / 9) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
      
      {/* LEFT COLUMN: Form Step Content Wizard */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Wizard progress bar */}
        <div className="flex flex-col gap-2 bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-text-primary">Step {currentStep} of 9</span>
            <span className="text-primary">{stepPercentage}% Complete</span>
          </div>
          
          <div className="w-full h-2 rounded-full bg-bg-muted overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${stepPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-text-muted mt-2 font-bold uppercase tracking-wider">
            <span>Progress auto-saves</span>
            {savingStatus === 'saving' && <span className="text-primary animate-pulse">Saving draft...</span>}
            {savingStatus === 'saved' && <span className="text-success font-black">Draft Auto-Saved</span>}
            {savingStatus === 'error' && <span className="text-danger">Save failed! check connection</span>}
          </div>
        </div>

        {/* Validation Errors banner */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-danger-muted border border-danger/20 flex flex-col gap-1.5 text-xs text-danger font-semibold">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Please resolve step validation alerts:</span>
            </div>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Dynamic Step form content wrappers */}
        <Card className="flex flex-col gap-6">
          
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" /> Basic Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Clinic Display Name"
                  required
                  value={formData.clinicName}
                  onChange={(e) => handleFieldChange('clinicName', e.target.value)}
                />
                <Input
                  label="Legal Business Name"
                  required
                  value={formData.legalBusinessName}
                  onChange={(e) => handleFieldChange('legalBusinessName', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Established Year"
                  type="number"
                  value={formData.establishedYear}
                  onChange={(e) => handleFieldChange('establishedYear', parseInt(e.target.value) || 2020)}
                />
                <Select
                  label="Clinic Type"
                  value={formData.clinicType}
                  onChange={(e) => handleFieldChange('clinicType', e.target.value)}
                  options={[
                    { value: 'Single Doctor', label: 'Single Doctor practice' },
                    { value: 'Multi Doctor', label: 'Multi-Doctor Clinic' },
                    { value: 'Hospital', label: 'General Hospital' },
                    { value: 'Dental', label: 'Dental Clinic' },
                    { value: 'Physiotherapy', label: 'Physiotherapy Center' },
                  ]}
                />
              </div>

              <Input
                label="Tagline Statement"
                placeholder="e.g. Caring for your family's health"
                value={formData.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
              />

              <Textarea
                label="Clinic Description / Overview"
                rows={4}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
          )}

          {/* STEP 2: Contact Details */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Contact Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Primary Contact Email"
                  type="email"
                  required
                  value={formData.primaryEmail}
                  onChange={(e) => handleFieldChange('primaryEmail', e.target.value)}
                />
                <Input
                  label="Primary Contact Phone"
                  type="tel"
                  required
                  value={formData.primaryPhone}
                  onChange={(e) => handleFieldChange('primaryPhone', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact Phone"
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)}
                />
                <Input
                  label="WhatsApp Contact Number"
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Support Mailbox"
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                />
                <Input
                  label="Website URL"
                  value={formData.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Address */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Clinic Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Country"
                  required
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                />
                <Input
                  label="State / Province"
                  required
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                />
                <Input
                  label="ZIP / Pincode"
                  required
                  value={formData.pincode}
                  onChange={(e) => handleFieldChange('pincode', e.target.value)}
                />
              </div>

              <Input
                label="Street Address Line 1"
                required
                value={formData.addressLine1}
                onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
              />

              <Input
                label="Street Address Line 2"
                value={formData.addressLine2}
                onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
              />

              <Input
                label="Google Maps Url Location"
                placeholder="https://maps.google.com/?q=..."
                value={formData.googleMapsUrl}
                onChange={(e) => handleFieldChange('googleMapsUrl', e.target.value)}
              />
            </div>
          )}

          {/* STEP 4: Doctor Information */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
                <Users className="w-5 h-5 text-primary" /> Doctor Profiles Information
              </h2>

              {/* Add Doctor form block */}
              <div className="p-4 rounded-xl border border-border-subtle bg-bg-muted/10 flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Add New Physician Profile</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Doctor Name"
                    placeholder="Dr. Gregory House"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                  <Input
                    label="Qualification"
                    placeholder="M.D., Cardiologist"
                    value={docQual}
                    onChange={(e) => setDocQual(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Specialization"
                    placeholder="Cardiology"
                    value={docSpec}
                    onChange={(e) => setDocSpec(e.target.value)}
                  />
                  <Input
                    label="License Registration Number"
                    placeholder="REG-104958"
                    value={docRegNum}
                    onChange={(e) => setDocRegNum(e.target.value)}
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={docExp}
                    onChange={(e) => setDocExp(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Consultation Fee ($)"
                    type="number"
                    value={docFee}
                    onChange={(e) => setDocFee(e.target.value)}
                  />
                  <Button
                    onClick={handleAddDoctor}
                    type="button"
                    variant="outline"
                    className="self-end py-2.5 h-[40px] text-xs font-bold"
                  >
                    Add Doctor to Roster
                  </Button>
                </div>
              </div>

              {/* Added doctors list */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Added Doctors Roster ({formData.doctors.length})</span>
                {formData.doctors.length === 0 ? (
                  <span className="text-xs text-text-muted py-4 text-center">No doctors added yet.</span>
                ) : (
                  formData.doctors.map((doc, index) => (
                    <div key={index} className="p-3 rounded-xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-text-primary">{doc.name}</div>
                        <div className="text-[9px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">
                          {doc.specialization} • Reg: {doc.registrationNumber}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDoctor(index)}
                        type="button"
                        className="p-1.5 rounded-lg text-danger hover:bg-danger-muted/30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Services */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" /> Services Offered
              </h2>

              <Textarea
                label="Offer Services (comma-separated list)"
                rows={5}
                value={formData.services}
                onChange={(e) => handleFieldChange('services', e.target.value)}
              />
              <p className="text-[10px] text-text-muted leading-relaxed font-semibold">
                Examples: General Physician, Pediatrics, Orthopedics, Cardiology, Gynecology, Dental, ENT, Vaccination, Diagnostics.
              </p>
            </div>
          )}

          {/* STEP 6: Working Hours */}
          {currentStep === 6 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Operational Working Hours
              </h2>

              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Select Working Days</span>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const active = formData.workingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const updated = active
                            ? formData.workingDays.filter((d: string) => d !== day)
                            : [...formData.workingDays, day];
                          handleFieldChange('workingDays', updated);
                        }}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                          active
                            ? 'bg-primary text-white'
                            : 'bg-bg-muted text-text-secondary border border-border-subtle hover:bg-border-subtle'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <Input
                  label="Opening Time"
                  placeholder="09:00 AM"
                  value={formData.openingTime}
                  onChange={(e) => handleFieldChange('openingTime', e.target.value)}
                />
                <Input
                  label="Closing Time"
                  placeholder="05:00 PM"
                  value={formData.closingTime}
                  onChange={(e) => handleFieldChange('closingTime', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Lunch Break Timeframe"
                  placeholder="01:00 PM - 02:00 PM"
                  value={formData.lunchBreak}
                  onChange={(e) => handleFieldChange('lunchBreak', e.target.value)}
                />
                <Input
                  label="Slot Duration (mins)"
                  type="number"
                  value={formData.averageConsultationTime}
                  onChange={(e) => handleFieldChange('averageConsultationTime', parseInt(e.target.value) || 15)}
                />
                <Input
                  label="Max Queue size limit"
                  type="number"
                  value={formData.maxQueueSize}
                  onChange={(e) => handleFieldChange('maxQueueSize', parseInt(e.target.value) || 50)}
                />
              </div>
            </div>
          )}

          {/* STEP 7: Document Uploads */}
          {currentStep === 7 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
                <Upload className="w-5 h-5 text-primary" /> Upload Certificates
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Document Category Type"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  options={[
                    { value: 'MEDICAL_LICENSE', label: 'Physician Medical License' },
                    { value: 'CLINIC_REGISTRATION', label: 'Clinic Registration Certificate' },
                    { value: 'IDENTITY_PROOF', label: 'Identity Verification card (PAN/Passport)' },
                  ]}
                />
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Choose file attachment</span>
                  <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-border-subtle hover:border-primary bg-bg-muted/10 cursor-pointer transition text-xs font-bold text-text-secondary h-[40px]">
                    <Upload className="w-4 h-4 text-text-muted mr-2" /> Browse Attachment
                    <input 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg" 
                      className="hidden" 
                      onChange={handleDocUpload}
                    />
                  </label>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="w-full flex flex-col gap-1.5 text-[10px] font-bold text-text-muted">
                  <span>Uploading file: {uploadProgress}%</span>
                  <div className="w-full h-1.5 rounded-full bg-bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Uploaded documents list */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Uploaded files roster ({formData.documents.length})</span>
                {formData.documents.length === 0 ? (
                  <span className="text-xs text-text-muted py-4 text-center">No certificates uploaded yet. (Medical License and Clinic Reg required)</span>
                ) : (
                  formData.documents.map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl border border-border-subtle bg-bg-surface flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-text-primary truncate max-w-xs">{doc.fileName}</div>
                        <div className="text-[9px] text-text-muted mt-0.5 font-bold uppercase tracking-wider">
                          Type: {doc.documentType.replace('_', ' ')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDoc(doc.id)}
                        type="button"
                        className="p-1.5 rounded-lg text-danger hover:bg-danger-muted/30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 8: Settings */}
          {currentStep === 8 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Clinic Rules & Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Token prefix prefix"
                  placeholder="e.g. T"
                  value={formData.tokenPrefix}
                  onChange={(e) => handleFieldChange('tokenPrefix', e.target.value)}
                />
                <Input
                  label="Maximum Daily Tokens Cap"
                  type="number"
                  value={formData.maxDailyTokens}
                  onChange={(e) => handleFieldChange('maxDailyTokens', parseInt(e.target.value) || 100)}
                />
                <Select
                  label="Timezone Profile"
                  value={formData.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  options={[
                    { value: 'EST', label: 'Eastern Standard Time (EST)' },
                    { value: 'CST', label: 'Central Standard Time (CST)' },
                    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                    { value: 'IST', label: 'India Standard Time (IST)' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {([
                  { key: 'queueEnabled', label: 'Enable Waitlist queue telemetry' },
                  { key: 'appointmentsEnabled', label: 'Enable online schedule reservations' },
                  { key: 'walkInPatients', label: 'Support walk-in patient profiles' },
                  { key: 'emergencyQueue', label: 'Support emergency priority bypass rules' },
                ] as const).map((item) => (
                  <label key={item.key} className="flex items-center gap-3 p-3.5 border border-border-subtle rounded-xl bg-bg-muted/10 cursor-pointer select-none text-xs font-bold text-text-secondary hover:bg-bg-muted/30 transition">
                    <input
                      type="checkbox"
                      checked={formData[item.key]}
                      onChange={(e) => handleFieldChange(item.key, e.target.checked)}
                      className="rounded border-border-subtle text-primary focus:ring-primary-glow shrink-0"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: Review & Submit */}
          {currentStep === 9 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2 border-b border-border-subtle/50 pb-3">
                <ShieldCheck className="w-5 h-5 text-success" /> Review & Submit Verification Application
              </h2>

              <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                Please double-check all information before submitting. Once submitted, your profile details will be locked from editing while our administrators verify your credentials.
              </p>

              <div className="p-4 rounded-xl bg-bg-muted/30 border border-border-subtle flex flex-col gap-2.5 text-xs text-text-secondary font-medium">
                <div className="flex justify-between">
                  <span className="font-extrabold">Clinic Name:</span>
                  <span>{formData.clinicName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-extrabold">Business Registration:</span>
                  <span>{formData.legalBusinessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-extrabold">Primary Contact:</span>
                  <span>{formData.primaryPhone} ({formData.primaryEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-extrabold">Registered Doctors:</span>
                  <span>{formData.doctors.length} doctors configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-extrabold">Uploaded Documents:</span>
                  <span>{formData.documents.length} certificates attached</span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none text-[10px] text-text-secondary font-bold mt-2">
                <input
                  type="checkbox"
                  checked={termsAccepted} // Wait, let's keep a state for terms check
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded border-border-subtle text-primary mt-0.5 focus:ring-primary-glow shrink-0"
                />
                <span className="leading-tight">
                  I accept that Q-Clinix may run licensing verification audits with state health registries, and I certify that all supplied physician files and registration certificates are authentic.
                </span>
              </label>

              <Button
                onClick={handleSubmitReview}
                disabled={!termsAccepted}
                variant="primary"
                className="w-full mt-4"
                isLoading={submitLoading}
              >
                Submit Application for Review
              </Button>
            </div>
          )}

          {/* Stepper controls row */}
          <div className="flex justify-between items-center border-t border-border-subtle/50 pt-5 mt-4">
            <Button
              onClick={handleBack}
              disabled={currentStep === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" /> Back
            </Button>
            
            {currentStep < 9 ? (
              <Button
                onClick={handleNext}
                variant="primary"
                size="sm"
              >
                Next Step <ChevronRight className="w-4 h-4 shrink-0" />
              </Button>
            ) : null}
          </div>

        </Card>
      </div>

      {/* RIGHT COLUMN: Live Patient Profile Preview Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-1.5">
          <Eye className="w-4.5 h-4.5 text-primary" /> Live Public Profile Preview
        </div>
        <ProfilePreview data={formData} />
      </div>

    </div>
  );
};
