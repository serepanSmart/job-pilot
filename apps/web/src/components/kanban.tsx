'use client';

import {
  JOB_STATUS_LABELS,
  PIPELINE_STATUSES,
  type Job,
  type JobStatus,
} from '@jobpilot/db';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useCallback, useOptimistic, useState, useTransition } from 'react';
import { setJobStatus } from '@/app/actions/jobs';
import { tokens } from '@/theme/tokens';
import { ScoreRing } from './score-ring';
import { TruncatedText } from './truncated-text';

const isPipelineStatus = (value: string): value is JobStatus => {
  return (PIPELINE_STATUSES as readonly string[]).includes(value);
};

const DraggableCard = ({ job }: { readonly job: Job }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({ id: job.id });
  return (
    <Card
      variant="outlined"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      <CardContent dense>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <ScoreRing score={job.score} size={36} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TruncatedText
              text={job.company}
              variant="body2"
              sx={{ fontWeight: 600 }}
            />
            <TruncatedText
              text={job.role}
              variant="caption"
              color="text.secondary"
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
DraggableCard.displayName = 'DraggableCard';

const Column = ({
  jobs,
  status,
}: {
  readonly jobs: Job[];
  readonly status: JobStatus;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: '1 1 0',
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 1.5,
        borderRadius: `${tokens.radius}px`,
        border: '1px solid',
        borderColor: isOver ? tokens.border.hover : 'transparent',
        backgroundColor: isOver ? tokens.chipFill : 'transparent',
        transition: `background-color ${tokens.transition}, border-color ${tokens.transition}`,
      }}
    >
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="subtitle2">{JOB_STATUS_LABELS[status]}</Typography>
        <Chip label={jobs.length} />
      </Stack>

      {jobs.map((job) => (
        <DraggableCard key={job.id} job={job} />
      ))}
    </Box>
  );
};
Column.displayName = 'Column';

interface Move {
  readonly from: JobStatus;
  readonly job: Job;
  readonly to: JobStatus;
}

export const Kanban = ({ initialJobs }: { readonly initialJobs: Job[] }) => {
  const [jobs, applyOptimistic] = useOptimistic(
    initialJobs,
    (current: Job[], move: { readonly id: string; readonly to: JobStatus }) =>
      current.map((item) =>
        item.id === move.id ? { ...item, status: move.to } : item
      )
  );

  const [moved, setMoved] = useState<Move | null>(null);
  const [, startTransition] = useTransition();

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const target = event.over?.id;
      if (typeof target !== 'string' || !isPipelineStatus(target)) {
        return;
      }

      const job = jobs.find((item) => item.id === event.active.id);
      if (!job || job.status === target) {
        return;
      }

      setMoved({ from: job.status, job, to: target });

      startTransition(async () => {
        applyOptimistic({ id: job.id, to: target });
        await setJobStatus(job.id, target);
      });
    },
    [jobs, applyOptimistic, startTransition]
  );

  const undo = () => {
    if (!moved) {
      return;
    }
    const { from, job } = moved;
    setMoved(null);

    startTransition(async () => {
      applyOptimistic({ id: job.id, to: from });
      await setJobStatus(job.id, from);
    });
  };

  if (!jobs.length) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Pipeline is empty</Typography>
            <Typography variant="body2" color="text.secondary">
              Shortlist jobs from the{' '}
              <Link href="/" style={{ color: 'inherit' }}>
                Inbox
              </Link>{' '}
              to move them into the pipeline.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <DndContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2 }}>
          {PIPELINE_STATUSES.map((status) => (
            <Column
              key={status}
              jobs={jobs.filter((job) => job.status === status)}
              status={status}
            />
          ))}
        </Box>
      </DndContext>

      <Snackbar
        open={moved !== null}
        autoHideDuration={6000}
        onClose={() => {
          setMoved(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          moved
            ? `${moved.job.company} -> ${JOB_STATUS_LABELS[moved.to]}`
            : undefined
        }
        action={
          <Button color="primary" size="small" onClick={undo}>
            Undo
          </Button>
        }
      />
    </>
  );
};
Kanban.displayName = 'Kanban';
