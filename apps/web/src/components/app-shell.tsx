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

/**
 * Chrome only. Page width is each page's own decision via PageContainer —
 * the kanban needs the full viewport, reading views do not.
 */
export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <>
      {/* The bar itself spans the viewport (the glassmorphism edge and bottom
          divider should not stop mid-screen); only its contents are contained.
          Width is xl — the widest page — so the logo and nav never shift
          position when moving between pages of different widths. */}
      <AppBar position="sticky">
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2 }}>
            {/* next/link rendered directly is fine; only *passing* it as a prop
                into a client component is not. */}
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
