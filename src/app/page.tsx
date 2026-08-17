'use client';

import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SearchPanel } from '@/features/public/components/SearchPanel';
import { ClinicCard, type PublicClinic } from '@/features/public/components/ClinicCard';
import { JoinQueueDialog } from '@/features/public/components/JoinQueueDialog';
import { TokenSuccess, type TokenSuccessData } from '@/features/public/components/TokenSuccess';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import { alpha } from '@mui/material/styles';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TvIcon from '@mui/icons-material/Tv';
import LayersIcon from '@mui/icons-material/Layers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

interface HomeSearchParams {
  query?: string;
  location?: string;
  pincode?: string;
  openNow?: boolean;
  hasQueue?: boolean;
  clinicType?: string;
  sortBy?: string;
}

export default function Home() {
  const [clinicsList, setClinicsList] = useState<PublicClinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [searchParams, setSearchParams] = useState<HomeSearchParams>({ query: '', sortBy: 'shortest_wait' });

  const [activeJoinClinic, setActiveJoinClinic] = useState<PublicClinic | null>(null);
  const [generatedToken, setGeneratedToken] = useState<TokenSuccessData | null>(null);

  const fetchClinics = async (params: HomeSearchParams) => {
    setLoadingClinics(true);
    try {
      const queryString = new URLSearchParams({
        query: params.query || '',
        location: params.location || '',
        pincode: params.pincode || '',
        openNow: params.openNow ? 'true' : 'false',
        hasQueue: params.hasQueue ? 'true' : 'false',
        clinicType: params.clinicType || 'All',
        sortBy: params.sortBy || 'shortest_wait',
      }).toString();

      const res = await fetch(`/api/clinics/search?${queryString}`);
      if (res.ok) {
        const data = await res.json();
        setClinicsList(data);
      }
    } catch (e) {
      console.error('Failed to query clinics:', e);
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => fetchClinics(searchParams), 0);
    return () => clearTimeout(id);
  }, [searchParams]);

  const features: {
    icon: React.ReactNode;
    colorKey: 'primary' | 'success' | 'secondary' | 'error' | 'warning';
    title: string;
    description: string;
  }[] = [
    { icon: <SmartphoneIcon />, colorKey: 'primary', title: 'QR Check-In Kiosk', description: 'Patients check in by scanning a unique QR code. Automates token generation and alerts staff instantly.' },
    { icon: <AccessTimeIcon />, colorKey: 'primary', title: 'Live Queue Status', description: 'Real-time updates of queue positions, estimated wait times, and serving room indicators via WebSockets.' },
    { icon: <GroupIcon />, colorKey: 'success', title: 'Walk-In Registrations', description: 'Fast-track tablet inputs for walk-in patient profiles. Generates physical and digital token slips.' },
    { icon: <SmartToyIcon />, colorKey: 'secondary', title: 'AI Optimization', description: 'Predictive algorithms forecasting patient arrival surges, consultation duration, and no-show probabilities.' },
    { icon: <TvIcon />, colorKey: 'error', title: 'TV Waiting Room Display', description: 'High-contrast visual boards with voice synthetic ticket announcements to coordinate waiting halls.' },
    { icon: <LayersIcon />, colorKey: 'warning', title: 'Multi-Clinic SaaS', description: 'Run multiple branches or clinics on a unified tenant model. Strict isolated data architectures.' },
  ];

  const faqs = [
    { title: 'Do I need to sign up to join the queue?', content: 'No. Q-Clinix enforces account-free patient check-ins. Simply input your name, age, and phone number to obtain a waiting slip. The browser saves your ticket key dynamically.' },
    { title: 'How is the wait time estimated?', content: "Estimates are derived by multiplying the current count of waiting patient tokens ahead of you by the doctor's historical average consultation time limit." },
    { title: 'Can I cancel my place if I am running late?', content: 'Yes. You can cancel your online check-in ticket at any time directly from the Track Queue console.' },
  ];

  return (
    <PublicLayout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8, pb: 10 }}>
        {/* HERO SEARCH PORTAL BANNER */}
        <Box
          component="section"
          sx={{
            pt: 8,
            pb: 7,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: (t) => `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.primary.main}0F 100%)`,
          }}
        >
          <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2.5 }}>
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Skip the Waiting Hall"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'primary.main',
                bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.3 : 0.12),
              }}
            />

            <Typography
              variant="h2"
              component="h1"
              sx={{ fontSize: { xs: 34, sm: 46 }, lineHeight: 1.1, maxWidth: 640 }}
            >
              Locate Clinics &amp; Join the{' '}
              <Typography component="span" sx={{ color: 'primary.main', fontWeight: 900 }}>Lobby Queue</Typography>{' '}
              Digitally
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.6, fontWeight: 600 }}>
              Find qualified physicians, track live patient wait times, and join virtual lines from your mobile browser without creating accounts.
            </Typography>

            <Box sx={{ width: '100%', maxWidth: 880, mt: 2 }}>
              <SearchPanel onSearch={setSearchParams} />
            </Box>
          </Container>
        </Box>

        {/* CLINIC SEARCH RESULTS PORTAL */}
        <Container maxWidth="lg" sx={{ mt: -4 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <LocalHospitalIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Near-by Operational Clinics</Typography>
            </Stack>
            <Chip label={`${clinicsList.length} matching centers`} size="small" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }} />
          </Stack>

          {loadingClinics ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 3, mt: 3 }}>
              {[1, 2, 3].map((n) => (
                <Card key={n} sx={{ p: 3 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="70%" height={32} />
                  <Skeleton variant="rounded" height={48} sx={{ mt: 2 }} />
                </Card>
              ))}
            </Box>
          ) : clinicsList.length === 0 ? (
            <Box
              sx={{
                mt: 3,
                p: 8,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 4,
              }}
            >
              <Typography variant="h4" sx={{ mb: 1, opacity: 0.8 }}>🏥</Typography>
              <Typography variant="h6">No Matching Clinics Found</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, lineHeight: 1.6 }}>
                Adjust search keywords or remove location filters to locate available healthcare centers.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 3, mt: 3 }}>
              {clinicsList.map((clinic) => (
                <ClinicCard key={clinic.id} clinic={clinic} onJoinQueue={setActiveJoinClinic} />
              ))}
            </Box>
          )}
        </Container>

        {/* MODAL WRAPPER OR CONDITIONAL PORTALS */}
        {activeJoinClinic && (
          <JoinQueueDialog
            clinic={activeJoinClinic}
            onClose={() => setActiveJoinClinic(null)}
            onSuccess={(tokenData) => {
              setActiveJoinClinic(null);
              setGeneratedToken(tokenData);
              fetchClinics(searchParams);
            }}
          />
        )}

        {generatedToken && (
          <TokenSuccess tokenData={generatedToken} onClose={() => setGeneratedToken(null)} />
        )}

        {/* MARKETING / PRODUCT SECTION */}
        <Container maxWidth="lg" sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4">Clinic SaaS Operations Platform</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', mt: 1, lineHeight: 1.6, fontWeight: 600 }}>
              Powering modern clinics with visual lobby status displays, AI wait estimations, and tablet check-in portals.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {features.map((feat, idx) => (
              <Card key={idx} variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: (t) => t.palette[feat.colorKey].main,
                      bgcolor: (t) => alpha(t.palette[feat.colorKey].main, t.palette.mode === 'dark' ? 0.22 : 0.12),
                    }}
                  >
                    {feat.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontSize: 15, mt: 0.5 }}>{feat.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feat.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>

        {/* FAQ ACCORDION PANEL */}
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5">Frequently Asked Questions</Typography>
          </Box>

          {faqs.map((faq) => (
            <Accordion key={faq.title} sx={{ '&:not(:last-child)': { mb: 1.5 } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ '& .MuiAccordionSummary-content': { py: 0.5 } }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{faq.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>
    </PublicLayout>
  );
}