import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { PageContainer } from '@/components/page-container';

export default function StatsLoading() {
  return (
    <PageContainer>
      <Skeleton variant="text" width={120} height={36} sx={{ mb: 3 }} />
      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} variant="outlined" sx={{ flex: 1, p: 2 }}>
              <Skeleton variant="text" width="60%" height={18} />
              <Skeleton variant="text" width="40%" height={32} />
            </Card>
          ))}
        </Stack>
        <Card variant="outlined" sx={{ p: 3 }}>
          <Skeleton variant="text" width={140} height={24} sx={{ mb: 2 }} />
          <Box sx={{ height: 200 }}>
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </Box>
        </Card>
        <Card variant="outlined" sx={{ p: 3 }}>
          <Skeleton variant="text" width={180} height={24} sx={{ mb: 2 }} />
          <Box sx={{ height: 200 }}>
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </Box>
        </Card>
      </Stack>
    </PageContainer>
  );
}
