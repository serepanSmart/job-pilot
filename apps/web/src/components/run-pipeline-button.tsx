'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Status = 'idle' | 'running' | 'done' | 'error';

export const RunPipelineButton = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const run = async () => {
    setStatus('running');
    try {
      const res = await fetch('/api/pipeline', { method: 'POST' });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setStatus('done');
        setMessage('Pipeline complete - refreshing inbox...');
        router.refresh();
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Pipeline failed');
      }
    } catch {
      setStatus('error');
      setMessage('Request failed');
    }
  };

  const close = () => {
    setStatus('idle');
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={run}
        disabled={status === 'running'}
        startIcon={
          status === 'running' ? (
            <CircularProgress size={14} color="inherit" />
          ) : undefined
        }
      >
        {status === 'running' ? 'Running...' : 'Fetch Jobs'}
      </Button>

      <Snackbar
        open={status === 'done' || status === 'error'}
        autoHideDuration={5000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={status === 'done' ? 'success' : 'error'}
          onClose={close}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};
RunPipelineButton.displayName = 'RunPipelineButton';
