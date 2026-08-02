import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { PageContainer } from '@/components/page-container';

export default function PipelineLoading() {
  return (
    <PageContainer>
      <Skeleton variant="text" width={160} height={36} sx={{ mb: 3 }} />
      <Stack direction="row" spacing={2} sx={{ overflow: 'hidden' }}>
        {[0, 1, 2, 3].map((col) => (
          <Box key={col} sx={{ minWidth: 260, flex: 1 }}>
            <Skeleton variant="text" width={100} height={24} sx={{ mb: 1 }} />
            <Stack spacing={1.5}>
              {[0, 1].map((card) => (
                <Card key={card} variant="outlined" sx={{ p: 2 }}>
                  <Skeleton variant="text" width="70%" height={22} />
                  <Skeleton variant="text" width="50%" height={18} />
                </Card>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </PageContainer>
  );
}
