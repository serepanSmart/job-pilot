'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { PageContainer } from '@/components/page-container';

interface ErrorProps {
  reset: () => void;
}

export default function DashboardError({ reset }: ErrorProps) {
  return (
    <PageContainer>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
          gap: 2,
        }}
      >
        <Typography variant="h5" component="h1">
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary">
          An unexpected error occurred while loading this page.
        </Typography>
        <Button variant="contained" onClick={reset} sx={{ mt: 2 }}>
          Try again
        </Button>
      </Box>
    </PageContainer>
  );
}

DashboardError.displayName = 'DashboardError';
