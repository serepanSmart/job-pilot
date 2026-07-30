import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { Inbox } from '@/components/inbox';
import { PageContainer } from '@/components/page-container';
import { getInboxJobs } from '@/lib/jobs';

export const metadata: Metadata = { title: 'Inbox · JobPilot' };
export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const jobs = await getInboxJobs();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Typography variant="h5">Inbox</Typography>
          <Typography variant="body2" color="text.secondary">
            {jobs.length} to triage · <kbd>j</kbd>/<kbd>k</kbd> move ·{' '}
            <kbd>s</kbd> shortlist · <kbd>x</kbd> archive · <kbd>u</kbd> undo
          </Typography>
        </Stack>

        <Inbox initialJobs={jobs} />
      </Stack>
    </PageContainer>
  );
}
