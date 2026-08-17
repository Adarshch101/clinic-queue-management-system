'use client';

import React from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        bgcolor: 'background.default',
        color: 'text.primary',
        overflow: 'hidden',
      }}
    >
      {/* Left Column: Split Graphic Screen */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: 384,
            height: 384,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            filter: 'blur(72px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: 384,
            height: 384,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            filter: 'blur(72px)',
            pointerEvents: 'none',
          }}
        />

        <NextLink href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content', position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 3,
              bgcolor: 'white',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 20,
            }}
          >
            Q
          </Box>
          <Typography component="span" sx={{ fontWeight: 800, fontSize: 18, color: 'white' }}>
            Q-Clinix
          </Typography>
        </NextLink>

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 420, my: 'auto' }}>
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 800,
              bgcolor: 'rgba(255,255,255,0.12)',
              px: 1.5,
              py: 0.5,
              borderRadius: 99,
            }}
          >
            Modern Patient Flow
          </Box>
          <Typography
            variant="h3"
            sx={{ mt: 3, lineHeight: 1.15, color: 'white', fontWeight: 900, letterSpacing: '-0.02em' }}
          >
            Coordinate waiting halls, consult doctors, and optimize telemetry.
          </Typography>
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontWeight: 400 }}>
            Join hundreds of modern clinics migrating to AI-driven wait list telemetry and real-time check-in kiosks.
          </Typography>
        </Box>

        <Typography sx={{ position: 'relative', zIndex: 1, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
          © 2026 Q-Clinix Inc. HIPAA Compliant Multi-Tenant Queue SaaS.
        </Typography>
      </Box>

      {/* Right Column: Dynamic Form Screen */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        <Button
          component={NextLink}
          href="/"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ position: 'absolute', top: 24, left: 24, color: 'text.secondary' }}
        >
          Home Page
        </Button>

        <Card
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 480,
            borderRadius: 4,
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 900, letterSpacing: '-0.01em' }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
              {subtitle}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</Box>
        </Card>
      </Box>
    </Box>
  );
};
export default AuthLayout;