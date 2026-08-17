'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  validateEmail, 
  validatePassword, 
  validatePhone, 
  validatePincode 
} from '../validators/authValidators';
import { AlertCircle, Building, User, Key, MapPin } from 'lucide-react';

export const RegisterForm: React.FC = () => {
  const router = useRouter();

  // Form Fields
  const [clinicName, setClinicName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Validation Warnings
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setPhoneError(null);
    setPasswordError(null);
    setPincodeError(null);
    setGeneralError(null);

    // 1. Inputs validation check
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) {
      setPasswordError(passErr);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    const pinErr = validatePincode(pincode);
    if (pinErr) {
      setPincodeError(pinErr);
      return;
    }

    if (!termsAccepted) {
      setGeneralError('You must accept the terms of service to proceed.');
      return;
    }

    setLoading(true);
    try {
      await authService.registerClinic({
        clinicName,
        subdomain: subdomain.toLowerCase().replace(/[^a-z0-9]/g, ''),
        ownerName,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        password,
      });

      router.push('/auth/pending');
    } catch (err) {
      console.error('Registration submit error:', err);
      setGeneralError(err instanceof Error ? err.message : String(err) || 'Verification registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {generalError && (
        <div className="p-3.5 rounded-xl bg-danger-muted border border-danger/25 text-danger text-xs font-bold flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Section: Clinic Info */}
      <div className="flex flex-col gap-3">
        <span className="text-[9px] uppercase font-black tracking-widest text-primary flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5" /> Clinic Workspace Detail
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Clinic Name"
            required
            placeholder="e.g. CareFirst Med"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
              SaaS Subdomain
            </label>
            <div className="relative w-full">
              <input
                type="text"
                required
                placeholder="carefirst"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border-subtle bg-bg-surface text-text-primary text-sm transition-all focus:outline-none pr-28 text-right font-medium"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                .q-clinix.com
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Location Info */}
      <div className="flex flex-col gap-3 border-t border-border-subtle/50 pt-3">
        <span className="text-[9px] uppercase font-black tracking-widest text-primary flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Address & Location
        </span>
        
        <Input
          label="Street Address"
          required
          placeholder="e.g. 742 Evergreen Terrace"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="City"
            required
            placeholder="Springfield"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            label="State"
            required
            placeholder="IL"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <Input
            label="Pincode/ZIP"
            required
            placeholder="62704"
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value);
              if (pincodeError) setPincodeError(null);
            }}
            error={pincodeError || undefined}
          />
        </div>
      </div>

      {/* Section: Administrator Info */}
      <div className="flex flex-col gap-3 border-t border-border-subtle/50 pt-3">
        <span className="text-[9px] uppercase font-black tracking-widest text-primary flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Clinic Administrator Profile
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Administrator Name"
            required
            placeholder="Dr. John Doe"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
          <Input
            label="Phone Number"
            type="tel"
            required
            placeholder="+1 555-0199"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            error={phoneError || undefined}
          />
        </div>

        <Input
          label="Administrative Email"
          type="email"
          required
          placeholder="admin@carefirst.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          error={emailError || undefined}
        />
      </div>

      {/* Section: Credentials Pass */}
      <div className="flex flex-col gap-3 border-t border-border-subtle/50 pt-3">
        <span className="text-[9px] uppercase font-black tracking-widest text-primary flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" /> Secure Credentials
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError || undefined}
          />
          <Input
            label="Confirm Password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border-subtle/50 pt-3">
        <label className="flex items-start gap-2 cursor-pointer select-none text-[10px] text-text-secondary font-bold">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="rounded border-border-subtle text-primary mt-0.5 focus:ring-primary-glow"
          />
          <span className="leading-tight">
            I verify that I am an authorized representative of this medical clinic branch, and I accept the terms of service and patient privacy disclosures.
          </span>
        </label>
      </div>

      <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
        Provision SaaS Workspace
      </Button>
    </form>
  );
};
