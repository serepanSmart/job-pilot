import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { PageContainer } from '@/components/page-container';

export default function JobDetailLoading() {
  return (
    <PageContainer>
      <Skeleton variant="text" width="45%" height={36} />
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} />

      <Stack spacing={3}>
        <Card variant="outlined" sx={{ p: 3 }}>
          <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width={80} height={28} />
            ))}
          </Stack>
          <Skeleton variant="text" width="100%" height={18} />
          <Skeleton variant="text" width="90%" height={18} />
          <Skeleton variant="text" width="75%" height={18} />
        </Card>

        <Card variant="outlined" sx={{ p: 3 }}>
          <Skeleton variant="text" width={160} height={24} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={200} />
        </Card>
      </Stack>
    </PageContainer>
  );
}
