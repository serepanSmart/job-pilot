'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, useTransition } from 'react';
import { setJobNotes } from '@/app/actions/jobs';

export const JobNotes = ({
  jobId,
  initialNotes,
}: {
  readonly jobId: string;
  readonly initialNotes: string;
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = notes !== initialNotes;

  const save = () => {
    startTransition(async () => {
      const result = await setJobNotes(jobId, notes);
      setSaved(result.ok);
    });
  };

  return (
    <Stack spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <TextField
        label="Notes"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setSaved(false);
        }}
        multiline
        minRows={3}
        fullWidth
      />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={save}
          disabled={pending || !dirty}
        >
          {pending ? 'Saving...' : 'Save notes'}
        </Button>
        {saved && !dirty ? (
          <Typography variant="caption" color="success.main">
            Saved
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
};
JobNotes.displayName = 'JobNotes';
