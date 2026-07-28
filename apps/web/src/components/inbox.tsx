'use client';

import type { Job } from '@jobpilot/db';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import { setJobStatus } from '@/app/actions/jobs';
import { formatAge, formatSource } from '@/lib/format';
import { ScoreRing } from './score-ring';

type TriageTarget = 'shortlisted' | 'archived';

interface Triage {
  readonly job: Job;
  readonly to: TriageTarget;
}

type OptimisticAction =
  | { readonly type: 'remove'; readonly id: string }
  | { readonly type: 'restore'; readonly job: Job };

function byScoreThenRecency(a: Job, b: Job): number {
  return (
    (b.score ?? 0) - (a.score ?? 0) ||
    b.dateFound.getTime() - a.dateFound.getTime()
  );
}

function clamp(length: number, index: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

export function Inbox({ initialJobs }: { readonly initialJobs: Job[] }) {
  /**
   * The server list is the source of truth. useOptimistic layers pending
   * triage on top and rebases automatically once revalidation lands, which is
   * why there is no effect syncing props into state.
   */
  const [jobs, applyOptimistic] = useOptimistic(
    initialJobs,
    (current: Job[], action: OptimisticAction) =>
      action.type === 'remove'
        ? current.filter((item) => item.id !== action.id)
        : [...current, action.job].sort(byScoreThenRecency)
  );

  const [selected, setSelected] = useState(0);
  const [lastTriage, setLastTriage] = useState<Triage | null>(null);
  const [, startTransition] = useTransition();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const triage = useCallback(
    (index: number, to: TriageTarget) => {
      const job = jobs[index];
      if (!job) return;

      setLastTriage({ job, to });
      setSelected((previous) => clamp(jobs.length - 1, previous));

      startTransition(async () => {
        applyOptimistic({ type: 'remove', id: job.id });
        await setJobStatus(job.id, to);
      });
    },
    [jobs, applyOptimistic, startTransition]
  );

  const undo = useCallback(() => {
    if (!lastTriage) return;
    const { job } = lastTriage;
    setLastTriage(null);

    startTransition(async () => {
      applyOptimistic({ type: 'restore', job });
      await setJobStatus(job.id, 'new');
    });
  }, [lastTriage, applyOptimistic, startTransition]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Never hijack keys while the user is typing.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case 'j':
          event.preventDefault();
          setSelected((index) => clamp(jobs.length, index + 1));
          break;
        case 'k':
          event.preventDefault();
          setSelected((index) => clamp(jobs.length, index - 1));
          break;
        case 's':
          event.preventDefault();
          triage(selected, 'shortlisted');
          break;
        case 'x':
          event.preventDefault();
          triage(selected, 'archived');
          break;
        case 'u':
          event.preventDefault();
          undo();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [jobs.length, selected, triage, undo]);

  // Keep the selected card in view during keyboard navigation.
  useEffect(() => {
    cardRefs.current[selected]?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [selected]);

  if (jobs.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6">Inbox is empty</Typography>
            <Typography variant="body2" color="text.secondary">
              Nothing left to triage. New jobs arrive every 6 hours once the
              pipeline is scheduled.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Stack spacing={1.5}>
        {jobs.map((job, index) => (
          <Card
            key={job.id}
            variant="outlined"
            ref={(node: HTMLDivElement | null) => {
              cardRefs.current[index] = node;
            }}
            data-selected={index === selected ? 'true' : 'false'}
            onClick={() => {
              setSelected(index);
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                spacing={2.5}
                sx={{ alignItems: 'flex-start' }}
                useFlexGap
              >
                <ScoreRing score={job.score} />

                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                    {job.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.company}
                  </Typography>

                  {job.verdict ? (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {job.verdict}
                    </Typography>
                  ) : null}

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ mt: 1.5, flexWrap: 'wrap' }}
                  >
                    <Chip label={formatSource(job.source)} />
                    {job.locationPolicy ? (
                      <Chip label={job.locationPolicy} />
                    ) : null}
                    <Chip label={formatAge(job.dateFound)} />
                    {job.salaryInfo ? <Chip label={job.salaryInfo} /> : null}
                    {job.redFlags.length > 0 ? (
                      <Chip
                        color="warning"
                        label={`${job.redFlags.length} red flag${
                          job.redFlags.length === 1 ? '' : 's'
                        }`}
                      />
                    ) : null}
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => {
                        triage(index, 'shortlisted');
                      }}
                    >
                      Shortlist
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        triage(index, 'archived');
                      }}
                    >
                      Archive
                    </Button>
                    <Button variant="text" size="small" href={`/job/${job.id}`}>
                      Details
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      component="a"
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open JD
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Snackbar
        open={lastTriage !== null}
        autoHideDuration={6000}
        onClose={() => {
          setLastTriage(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          lastTriage
            ? `${lastTriage.job.company} → ${lastTriage.to}`
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
}
