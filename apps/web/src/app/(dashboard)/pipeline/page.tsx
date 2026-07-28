import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { Kanban } from '@/components/kanban';
import { PageContainer } from '@/components/page-container';
import { getPipelineJobs } from '@/lib/jobs';

export const metadata: Metadata = { title: 'Pipeline · JobPilot' };
export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const jobs = await getPipelineJobs();

  return (
    <PageContainer width="wide">
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Typography variant="h5">Pipeline</Typography>
          <Typography variant="body2" color="text.secondary">
            {jobs.length} active · drag cards between columns
          </Typography>
        </Stack>

        <Kanban initialJobs={jobs} />
      </Stack>
    </PageContainer>
  );
}
