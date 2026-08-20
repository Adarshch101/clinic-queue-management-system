'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { 
  validateEmail, 
  validatePassword, 
  validatePhone 
} from '../validators/authValidators';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

export const PatientRegisterForm: React.FC = () => {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setEmailError(null);
    setPhoneError(null);
    setAgeError(null);
    setPasswordError(null);
    setGeneralError(null);

    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    if (name.trim().length < 2 || name.trim().length > 120) {
      setNameError('Name must be between 2 and 120 characters');
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) { setEmailError(emailErr); return; }

    const phoneErr = validatePhone(phone);
    if (phoneErr) { setPhoneError(phoneErr); return; }

    const parsedAge = parseInt(age, 10);
    if (!age || Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setAgeError('Please enter a valid age (1-120)');
      return;
    }

    const passErr = validatePassword(password);
    if (passErr) { setPasswordError(passErr); return; }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setGeneralError('You must accept the terms of service to proceed.');
      return;
    }

    setLoading(true);
    try {
      await authService.registerPatient({
        name: name.trim(),
        email,
        phone,
        age: parsedAge,
        gender,
        password,
      });

      router.push('/patient/dashboard');
    } catch (err) {
      console.error('Patient registration submit error:', err);
      setGeneralError(err instanceof Error ? err.message : String(err) || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionLabel = (icon: React.ReactNode, text: string) => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
      <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: 'primary.main' }}>
        {text}
      </Typography>
    </Stack>
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {generalError && <Alert severity="error" sx={{ fontSize: 13, fontWeight: 700 }}>{generalError}</Alert>}

      {/* Section: Personal Info */}
      <Box>
        {sectionLabel(<PersonIcon fontSize="small" />, 'Personal Information')}
        <TextField
          label="Full Name"
          required
          fullWidth
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          error={!!nameError}
          helperText={nameError || undefined}
          sx={{ mb: 1.5 }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Age"
            type="number"
            required
            fullWidth
            placeholder="30"
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
              if (ageError) setAgeError(null);
            }}
            error={!!ageError}
            helperText={ageError || undefined}
          />
          <TextField
            select
            label="Gender"
            required
            fullWidth
            value={gender}
            onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
            sx={{ minWidth: 120 }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </TextField>
        </Stack>
      </Box>

      <Divider />

      {/* Section: Contact Info */}
      <Box>
        {sectionLabel(<EmailIcon fontSize="small" />, 'Contact Details')}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Email Address"
            type="email"
            required
            fullWidth
            placeholder="john@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            error={!!emailError}
            helperText={emailError || undefined}
          />
          <TextField
            label="Phone Number"
            type="tel"
            required
            fullWidth
            placeholder="+1 555-0199"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            error={!!phoneError}
            helperText={phoneError || undefined}
          />
        </Stack>
      </Box>

      <Divider />

      {/* Section: Credentials */}
      <Box>
        {sectionLabel(<LockIcon fontSize="small" />, 'Secure Credentials')}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Password"
            type="password"
            required
            fullWidth
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            error={!!passwordError}
            helperText={passwordError || undefined}
          />
          <TextField
            label="Confirm Password"
            type="password"
            required
            fullWidth
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordError) setPasswordError(null);
            }}
            error={!!passwordError}
          />
        </Stack>
      </Box>

      <FormControlLabel
        control={<Checkbox checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} size="small" />}
        label={
          <Box component="span" sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1.5 }}>
            I accept the terms of service and patient privacy disclosures.
          </Box>
        }
        sx={{ alignItems: 'flex-start', '& .MuiFormControlLabel-label': { pt: 0.5 } }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ mt: 1, py: 1.5, fontWeight: 800 }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Patient Account'}
      </Button>
    </Box>
  );
};