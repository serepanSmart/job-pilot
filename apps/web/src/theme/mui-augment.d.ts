import type { CardContentOwnProps } from '@mui/material/CardContent';

declare module '@mui/material/CardContent' {
  interface CardContentOwnProps {
    compact?: boolean;
    dense?: boolean;
  }
}

export type { CardContentOwnProps };
