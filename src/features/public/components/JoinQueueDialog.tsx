'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { X, ShieldAlert } from 'lucide-react';

interface JoinQueueDoctor {
  id: string;
  name: string;
  specialization: string;
}

interface JoinQueueClinic {
  id: string;
  name: string;
  doctors?: JoinQueueDoctor[];
}

interface JoinQueueTokenData {
  sessionId: string;
  tokenId: string;
  tokenNumber: string;
}

interface JoinQueueDialogProps {
  clinic: JoinQueueClinic;
  onClose: () => void;
  onSuccess: (tokenData: JoinQueueTokenData) => void;
}

export const JoinQueueDialog: React.FC<JoinQueueDialogProps> = ({ clinic, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(clinic.doctors?.[0]?.id || '');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validations
    const validationErrors = [];
    if (!name.trim()) validationErrors.push('Patient display name is required.');
    if (!age || parseInt(age) < 0 || parseInt(age) > 130) {
      validationErrors.push('Please enter a valid age.');
    }
    if (!phone.trim()) {
      validationErrors.push('Contact phone number is required.');
    } else if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s-()]/g, ''))) {
      validationErrors.push('Please enter a valid phone number.');
    }
    if (!selectedDoctorId) {
      validationErrors.push('Please select a physician from the roster.');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: clinic.id,
          doctorId: selectedDoctorId,
          name,
          age: parseInt(age),
          gender,
          phone,
          reason: reason || 'General consultation checkup',
          isEmergency,
        }),
      });

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to register online queue token');
      }

      const tokenData: JoinQueueTokenData = responseData.data;
      
      // Store session metadata locally in browser
      localStorage.setItem('q-clinix-temp-session', JSON.stringify({
        sessionId: tokenData.sessionId,
        tokenId: tokenData.tokenId,
        clinicId: clinic.id,
        tokenNumber: tokenData.tokenNumber,
        timestamp: Date.now(),
      }));

      onSuccess(tokenData);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : String(err) || 'Something went wrong. Please check connection.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg bg-bg-surface border border-border-subtle shadow-2xl rounded-3xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border-subtle/50 px-6 py-4.5 bg-bg-muted/10">
          <div>
            <span className="text-[9px] font-black uppercase text-primary tracking-widest">Online Queue Registration</span>
            <h3 className="text-sm font-black text-text-primary mt-0.5">Join Queue: {clinic.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-muted transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-danger-muted border border-danger/25 text-[11px] text-danger font-semibold flex flex-col gap-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Correct the following inputs:
            </span>
            <ul className="list-disc pl-5 mt-0.5 space-y-0.5">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Doctor Roster"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              options={clinic.doctors?.map((doc) => ({
                value: doc.id,
                label: `${doc.name} (${doc.specialization})`,
              })) || []}
            />
            <Input
              label="Patient Full Name"
              placeholder="e.g. John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Age (years)"
              type="number"
              placeholder="32"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="1234567890"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Input
            label="Reason for Visit (Optional)"
            placeholder="e.g. Scheduled review, general headache"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <label className="flex items-center gap-3 p-3.5 border border-border-subtle/80 rounded-xl bg-danger-muted/10 cursor-pointer select-none text-[10px] text-danger font-extrabold hover:bg-danger-muted/20 transition mt-2">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="rounded border-danger text-danger focus:ring-danger"
            />
            <span>This is an emergency priority checkup request (instant bypass)</span>
          </label>

          {/* Footer Submit */}
          <div className="flex gap-3 justify-end border-t border-border-subtle/50 pt-5 mt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              className="bg-primary"
            >
              Confirm and Register Token
            </Button>
          </div>

        </form>

      </Card>
    </div>
  );
};
export default JoinQueueDialog;
