import Container from '@mui/material/Container';
import type { ReactNode } from 'react';

/**
 * Per-page width. Reading views (Inbox, job detail, stats) want a narrow
 * measure; the kanban needs room for seven columns, so it asks for `wide`.
 * Both keep the container gutters — nothing goes edge-to-edge.
 */
export function PageContainer({
  width = 'reading',
  children,
}: {
  readonly width?: 'reading' | 'wide';
  readonly children: ReactNode;
}) {
  return (
    <Container
      maxWidth={width === 'wide' ? 'xl' : 'md'}
      sx={{ py: { xs: 2, sm: 4 } }}
    >
      {children}
    </Container>
  );
}
