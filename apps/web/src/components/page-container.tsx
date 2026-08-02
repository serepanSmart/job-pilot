import Container from '@mui/material/Container';
import type { ReactNode } from 'react';

export const PageContainer = ({
  width = 'reading',
  children,
}: {
  readonly width?: 'reading' | 'wide';
  readonly children: ReactNode;
}) => {
  return (
    <Container
      maxWidth={width === 'wide' ? 'xl' : 'md'}
      sx={{ py: { xs: 2, sm: 4 } }}
    >
      {children}
    </Container>
  );
};
PageContainer.displayName = 'PageContainer';
