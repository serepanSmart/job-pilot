'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'running' | 'done' | 'error';

const alertSeverity = (s: Status): 'info' | 'success' | 'error' => {
  if (s === 'done') return 'success';
  if (s === 'error') return 'error';
  return 'info';
};

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 30 * 60 * 1000;

const isDone = (log: string): boolean =>
  /\[pipeline\] Done\./.test(log) || /npm ERR!/.test(log);

const isError = (log: string): boolean => /npm ERR!/.test(log);

export const RunPipelineButton = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);
  const router = useRouter();

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkLog = useCallback(async () => {
    if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
      stopPolling();
      setStatus('error');
      setMessage('Timed out waiting for pipeline to finish');
      return;
    }

    try {
      const res = await fetch('/api/pipeline');
      const data = (await res.json()) as { log: string };
      const log = data.log;

      if (!log) {
        return;
      }

      if (isDone(log)) {
        stopPolling();
        if (isError(log)) {
          setStatus('error');
          const match = /Error: (.+)/.exec(log);
          setMessage(match ? match[1].slice(0, 200) : 'Pipeline failed');
        } else {
          setStatus('done');
          setMessage('Pipeline complete - refreshing inbox...');
          router.refresh();
        }
      }
    } catch {
      // transient - keep polling
    }
  }, [stopPolling, router]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const run = async () => {
    stopPolling();
    setStatus('running');
    setMessage('Pipeline started...');

    try {
      const res = await fetch('/api/pipeline', { method: 'POST' });
      if (!res.ok) {
        setStatus('error');
        setMessage('Failed to start pipeline');
        return;
      }

      startedAtRef.current = Date.now();
      pollRef.current = setInterval(checkLog, POLL_INTERVAL_MS);
    } catch {
      setStatus('error');
      setMessage('Request failed');
    }
  };

  const close = () => {
    stopPolling();
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
        open={status === 'running' || status === 'done' || status === 'error'}
        autoHideDuration={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={alertSeverity(status)} onClose={close}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};
RunPipelineButton.displayName = 'RunPipelineButton';
