'use client';

import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from '@jobpilot/db';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useState, useTransition } from 'react';
import { setJobStatus } from '@/app/actions/jobs';

export const JobStatusSelect = ({
  jobId,
  initialStatus,
}: {
  readonly jobId: string;
  readonly initialStatus: JobStatus;
}) => {
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [pending, startTransition] = useTransition();

  return (
    <TextField
      select
      label="Status"
      value={status}
      disabled={pending}
      onChange={(event) => {
        const next = JOB_STATUSES.find((s) => s === event.target.value);
        if (!next) {
          return;
        }
        setStatus(next);
        startTransition(async () => {
          await setJobStatus(jobId, next);
        });
      }}
      sx={{ minWidth: 200 }}
    >
      {JOB_STATUSES.map((option) => (
        <MenuItem key={option} value={option}>
          {JOB_STATUS_LABELS[option]}
        </MenuItem>
      ))}
    </TextField>
  );
};
JobStatusSelect.displayName = 'JobStatusSelect';
