import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { PageContainer } from '@/components/page-container';

export default function DashboardLoading() {
  return (
    <PageContainer>
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Skeleton variant="text" width={120} height={36} />
          <Skeleton variant="text" width={200} height={20} />
        </Stack>

        {[0, 1, 2].map((i) => (
          <Card key={i} variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                spacing={2.5}
                sx={{ alignItems: 'flex-start' }}
              >
                <Skeleton variant="circular" width={52} height={52} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="55%" height={28} />
                  <Skeleton variant="text" width="35%" height={20} />
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={20}
                    sx={{ mt: 1 }}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Skeleton variant="rounded" width={72} height={24} />
                    <Skeleton variant="rounded" width={64} height={24} />
                    <Skeleton variant="rounded" width={56} height={24} />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </PageContainer>
  );
}
