import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logout } from '@/app/actions/auth';
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

            <Box component="form" action={logout}>
              <Button type="submit" variant="text" size="small">
                Sign out
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {children}
    </>
  );
};
AppShell.displayName = 'AppShell';
