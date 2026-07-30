import { JOB_STATUSES, JOB_STATUS_LABELS } from '@jobpilot/db';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import {
  FunnelChart,
  WeeklyApplicationsChart,
} from '@/components/stats-charts';
import { PageContainer } from '@/components/page-container';
import { getStats } from '@/lib/jobs';

export const metadata: Metadata = { title: 'Stats · JobPilot' };
export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Typography variant="h5">Stats</Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.total} jobs tracked
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
            },
          }}
        >
          {JOB_STATUSES.map((status) => (
            <Card key={status} variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography
                  variant="h5"
                  sx={{ fontFamily: 'var(--font-sora)' }}
                >
                  {stats.counts[status]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {JOB_STATUS_LABELS[status]}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Funnel
            </Typography>
            <FunnelChart data={stats.funnel} />
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Applications per week
            </Typography>
            {stats.weekly.length ? (
              <WeeklyApplicationsChart data={stats.weekly} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No applications recorded yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </PageContainer>
  );
}
