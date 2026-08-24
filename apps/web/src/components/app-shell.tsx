import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { GradientLogo } from './gradient-logo';
import { NavLinks } from './nav-links';

export const AppShell = ({ children }: { readonly children: ReactNode }) => {
  return (
    <>
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <GradientLogo />
            </Link>

            <NavLinks />
          </Toolbar>
        </Container>
      </AppBar>

      {children}
    </>
  );
};
AppShell.displayName = 'AppShell';
