import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logout } from '@/app/actions/auth';
import { GradientLogo } from './gradient-logo';

const NAV = [
  { href: '/', label: 'Inbox' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/stats', label: 'Stats' },
] as const;

export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <GradientLogo />
            </Link>

            <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1 }}>
              {NAV.map((item) => (
                <Button
                  key={item.href}
                  href={item.href}
                  variant="text"
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

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
}
AppShell.displayName = 'AppShell';
