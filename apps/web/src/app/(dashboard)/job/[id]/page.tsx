import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JobNotes } from '@/components/job-notes';
import { JobStatusSelect } from '@/components/job-status-select';
import { ScoreRing } from '@/components/score-ring';
import { formatDate, formatSource } from '@/lib/format';
import { PageContainer } from '@/components/page-container';
import { getJob } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export const generateMetadata = async ({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<Metadata> => {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return { title: 'Job not found · JobPilot' };
  }
  return { title: `${job.role} at ${job.company} · JobPilot` };
};

export default async function JobPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <ScoreRing score={job.score} size={64} />
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="h5">{job.role}</Typography>
            <Typography variant="body1" color="text.secondary">
              {job.company}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ mt: 1.5, flexWrap: 'wrap' }}
            >
              <Chip label={formatSource(job.source)} />
              {job.locationPolicy ? <Chip label={job.locationPolicy} /> : null}
              {job.salaryInfo ? <Chip label={job.salaryInfo} /> : null}
              {job.timezoneFit ? (
                <Chip label={`timezone: ${job.timezoneFit}`} />
              ) : null}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <JobStatusSelect jobId={job.id} initialStatus={job.status} />
          <Button
            variant="outlined"
            component="a"
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open original JD
          </Button>
        </Stack>

        {job.verdict ? <Alert severity="info">{job.verdict}</Alert> : null}

        {job.redFlags.map((flag) => (
          <Alert key={flag} severity="warning">
            {flag}
          </Alert>
        ))}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Matched ({job.matchedKeywords.length})
                </Typography>
                {job.matchedKeywords.length ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: 'wrap' }}
                  >
                    {job.matchedKeywords.map((keyword) => (
                      <Chip key={keyword} color="success" label={keyword} />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    None recorded.
                  </Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Missing ({job.missingKeywords.length})
                </Typography>
                {job.missingKeywords.length ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    sx={{ flexWrap: 'wrap' }}
                  >
                    {job.missingKeywords.map((keyword) => (
                      <Chip key={keyword} color="default" label={keyword} />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nothing missing.
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle2">Timeline</Typography>
              <Typography variant="body2" color="text.secondary">
                Found {formatDate(job.dateFound)}
                {job.dateApplied
                  ? ` · applied ${formatDate(job.dateApplied)}`
                  : ''}
                {job.followUpDue
                  ? ` · follow up ${formatDate(job.followUpDue)}`
                  : ''}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <JobNotes jobId={job.id} initialNotes={job.notes} />

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Job description
            </Typography>
            {job.description ? (
              <Box
                sx={{
                  typography: 'body2',
                  color: 'text.secondary',
                  '& p': { mb: 1 },
                  '& ul, & ol': { pl: 3, mb: 1 },
                  '& li': { mb: 0.5 },
                  '& a': { color: 'primary.main' },
                  '& strong, & b': { fontWeight: 600 },
                  '& h1, & h2, & h3, & h4': {
                    fontWeight: 600,
                    mb: 1,
                    mt: 2,
                    color: 'text.primary',
                  },
                }}
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No description captured.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </PageContainer>
  );
}
