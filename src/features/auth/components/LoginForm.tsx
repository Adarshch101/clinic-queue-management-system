'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../validators/authValidators';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setGeneralError(null);

    const mailErr = validateEmail(email);
    if (mailErr) {
      setEmailError(mailErr);
      return;
    }
    if (!password) {
      setGeneralError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const { profile } = await authService.login(email, password);
      await refreshProfile();

      if (profile.role === 'SUPER_ADMIN') {
        router.push('/admin/super-dashboard');
      } else {
        router.push(`/${profile.role.toLowerCase()}/dashboard`);
      }
    } catch (err) {
      console.error('Login submit error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('CLINIC_PENDING')) {
        router.push('/auth/pending');
      } else if (msg.includes('CLINIC_REJECTED')) {
        router.push('/auth/rejected');
      } else if (msg.includes('CLINIC_SUSPENDED')) {
        router.push('/auth/suspended');
      } else {
        setGeneralError(msg || 'Invalid email or password combination');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {generalError && <Alert severity="error" sx={{ fontSize: 13, fontWeight: 700 }}>{generalError}</Alert>}

      <TextField
        label="Email Address"
        type="email"
        required
        fullWidth
        placeholder="you@clinicdomain.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError(null);
        }}
        error={!!emailError}
        helperText={emailError || undefined}
      />

      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        required
        fullWidth
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="Toggle password visibility">
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <FormControlLabel
          control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" />}
          label={<Box component="span" sx={{ fontSize: 12, fontWeight: 700 }}>Remember me</Box>}
        />
        <Button
          type="button"
          size="small"
          onClick={() => router.push('/auth/forgot-password')}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Forgot Password?
        </Button>
      </Stack>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ mt: 1, py: 1.5, fontWeight: 800 }}
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : 'Authenticate Credentials'}
      </Button>
    </Box>
  );
};