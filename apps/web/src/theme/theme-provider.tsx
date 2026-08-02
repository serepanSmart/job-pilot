'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { theme } from './theme';

export const AppThemeProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  return (
    <ThemeProvider theme={theme} defaultMode="dark">
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
AppThemeProvider.displayName = 'AppThemeProvider';
