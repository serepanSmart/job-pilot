import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';
import { tokens } from '@/theme/tokens';

export function GradientLogo({ variant = 'h6', ...props }: TypographyProps) {
  return (
    <Typography
      {...props}
      variant={variant}
      component="span"
      sx={{
        backgroundImage: tokens.gradient,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontWeight: 700,
        userSelect: 'none',
      }}
    >
      JobPilot
    </Typography>
  );
}
GradientLogo.displayName = 'GradientLogo';
