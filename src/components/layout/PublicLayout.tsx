'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import NextLink from 'next/link';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/clinics', label: 'Clinics' },
    { href: '/queue-status', label: 'Live Queue' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/policies', label: 'Policies' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Premium Public Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: (t) => (t.palette.mode === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(11,15,25,0.72)'),
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: 64, gap: 2 }}>
          {/* Logo */}
          <NextLink href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 20,
                boxShadow: (t) => `0 8px 16px -4px ${t.palette.primary.main}55`,
              }}
            >
              Q
            </Box>
            <Typography
              component="span"
              sx={{
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '-0.02em',
                background: (t) => `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary?.main || t.palette.info.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Q-Clinix
            </Typography>
          </NextLink>

          {/* Desktop Navigation Links */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1, justifyContent: 'center' }}>
            {navLinks.map((link) => (
              <Button
                key={link.href}
                component={NextLink}
                href={link.href}
                size="small"
                color="inherit"
                sx={{ fontWeight: 700, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

{/* Right Header Controls */}
            <Box sx={{ flexGrow: { xs: 1, md: 0 }, display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.secondary' }} aria-label="Toggle theme">
                {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon sx={{ color: 'warning.main' }} />}
              </IconButton>

              <Button
                component={NextLink}
                href="/login"
                variant="outlined"
                size="small"
                startIcon={<LoginIcon />}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Portal Login
              </Button>

              <Button
                component={NextLink}
                href="/register/patient"
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Patient Sign Up
              </Button>

              <Button
                component={NextLink}
                href="/register"
                variant="contained"
                size="small"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Register Clinic
              </Button>

              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                size="small"
                sx={{ color: 'text.secondary', display: { md: 'none' } }}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <Box sx={{ width: 280, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 800 }}>Q-Clinix</Typography>
            <IconButton onClick={() => setMobileMenuOpen(false)} size="small" aria-label="Close menu">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          {navLinks.map((link) => (
            <Button
              key={link.href}
              component={NextLink}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              fullWidth
              sx={{ justifyContent: 'flex-start', py: 1.25 }}
            >
              {link.label}
            </Button>
          ))}
          <Divider sx={{ my: 1 }} />
          <Button component={NextLink} href="/policies" variant="outlined" fullWidth>
            Policies
          </Button>
          <Button component={NextLink} href="/login" variant="outlined" fullWidth>
            Portal Login
          </Button>
          <Button component={NextLink} href="/register/patient" variant="outlined" fullWidth startIcon={<PersonAddIcon />}>
            Patient Sign Up
          </Button>
          <Button component={NextLink} href="/register" variant="contained" fullWidth>
            Register Clinic
          </Button>
        </Box>
      </Drawer>

      {/* Page Content */}
      <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
        {children}
      </Box>

      {/* Premium Public Footer */}
      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', pt: 5, pb: 6 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ maxWidth: 320 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                  }}
                >
                  Q
                </Box>
                <Typography sx={{ fontWeight: 800 }}>Q-Clinix SaaS</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                Eliminate waiting room friction, streamline doctor scheduling, and optimize healthcare delivery with AI queue models.
              </Typography>
            </Box>

            <Stack direction="row" spacing={6} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Solutions
                </Typography>
                <Stack spacing={0.75}>
                  <Link component={NextLink} href="/clinics" color="text.secondary" underline="hover">Clinic Directory</Link>
                  <Link component={NextLink} href="/queue-status" color="text.secondary" underline="hover">Lobby Tracker</Link>
                </Stack>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Company
                </Typography>
                <Stack spacing={0.75}>
                  <Link component={NextLink} href="/about" color="text.secondary" underline="hover">About Us</Link>
                  <Link component={NextLink} href="/contact" color="text.secondary" underline="hover">Contact Support</Link>
                </Stack>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Legal
                </Typography>
                <Stack spacing={0.75}>
                  <Link href="/privacy" color="text.secondary" underline="hover">Privacy Policy</Link>
                  <Link href="/terms" color="text.secondary" underline="hover">Terms of Service</Link>
                  <Link href="/policies" color="text.secondary" underline="hover">Policies</Link>
                  <Link href="#" color="text.secondary" underline="hover">HIPAA Audit</Link>
                </Stack>
              </Box>
            </Stack>
          </Stack>

          <Divider sx={{ mt: 4, mb: 2 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.disabled">
              © 2026 Q-Clinix Inc. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Link href="#" color="text.secondary" underline="hover" variant="caption">Twitter</Link>
              <Link href="#" color="text.secondary" underline="hover" variant="caption">LinkedIn</Link>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};
export default PublicLayout;