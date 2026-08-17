import { createTheme, type ThemeOptions } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'var(--font-sans), system-ui, -apple-system, sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
    h1: { fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.01em' },
    h4: { fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 14, fontWeight: 700, letterSpacing: '-0.01em' },
        sizeLarge: { paddingX: 3, paddingY: 1.25 },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 20 } },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: { root: { borderRadius: 14 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiAccordion: {
      styleOverrides: { root: { borderRadius: 16, boxShadow: 'none' } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', dark: '#4338ca' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569', disabled: '#94a3b8' },
    divider: '#e2e8f0',
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#3b82f6' },
    grey: { 100: '#f1f5f9', 300: '#cbd5e1' },
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8' },
    background: { default: '#060813', paper: '#0b0f19' },
    text: { primary: '#f8fafc', secondary: '#94a3b8', disabled: '#64748b' },
    divider: '#1e293b',
    success: { main: '#34d399' },
    warning: { main: '#fbbf24' },
    error: { main: '#f87171' },
    info: { main: '#60a5fa' },
    grey: { 100: '#111827', 300: '#334155' },
  },
});