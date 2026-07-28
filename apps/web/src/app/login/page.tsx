import Box from '@mui/material/Box';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = { title: 'Sign in · JobPilot' };

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = typeof nextParam === 'string' ? nextParam : '/';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        p: 3,
      }}
    >
      <LoginForm next={next} />
    </Box>
  );
}
