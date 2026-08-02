'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useActionState } from 'react';
import { login, type LoginState } from '@/app/actions/auth';
import { GradientLogo } from './gradient-logo';

export const LoginForm = ({ next }: { readonly next: string }) => {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ width: '100%', maxWidth: 380 }}
    >
      <Stack spacing={3}>
        <Stack spacing={1} sx={{ alignItems: 'center' }}>
          <GradientLogo variant="h4" />
          <Typography variant="body2" color="text.secondary">
            Sign in to triage your inbox.
          </Typography>
        </Stack>

        {state.error ? <Alert severity="error">{state.error}</Alert> : null}

        <input type="hidden" name="next" value={next} />

        <TextField
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          autoFocus
          fullWidth
          required
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={pending}
          fullWidth
        >
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
      </Stack>
    </Box>
  );
};
LoginForm.displayName = 'LoginForm';
