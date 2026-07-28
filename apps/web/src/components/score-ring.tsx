import { SCORE_STRONG } from '@jobpilot/db';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { tokens } from '@/theme/tokens';

/**
 * Circular score badge. Gradient ring by default; turns success-green at 80+.
 * One of only three sanctioned gradient uses.
 *
 * Geometry lives here rather than in the theme because ScoreRing is not a MUI
 * component — but every colour still comes from the design tokens.
 */
export function ScoreRing({
  score,
  size = 48,
}: {
  readonly score: number | null;
  readonly size?: number;
}) {
  const strong = score !== null && score >= SCORE_STRONG;

  return (
    <Box
      aria-label={score === null ? 'Not scored' : `Score ${score} of 100`}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        padding: '2px',
        display: 'grid',
        placeItems: 'center',
        ...(strong
          ? { backgroundColor: tokens.status.success }
          : { backgroundImage: tokens.gradient }),
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          bgcolor: 'background.paper',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: 'var(--font-sora)',
            fontWeight: 600,
            fontSize: size * 0.34,
            lineHeight: 1,
            color: strong ? tokens.status.success : tokens.text.primary,
          }}
        >
          {score ?? '—'}
        </Typography>
      </Box>
    </Box>
  );
}
