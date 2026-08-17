'use client';

import React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useApp } from '@/context/AppContext';
import { lightTheme, darkTheme } from '@/lib/muiTheme';

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme === 'dark' ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}