import { SCORE_STRONG, SCORE_THRESHOLD } from '@jobpilot/db';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { tokens } from '@/theme/tokens';

export const ScoreRing = ({
  score,
  size = 48,
}: {
  readonly score: number | null;
  readonly size?: number;
}) => {
  const strong = score !== null && score >= SCORE_STRONG;
  const medium = score !== null && !strong && score >= SCORE_THRESHOLD;

  let ringColor: Record<string, string>;
  if (strong) {
    ringColor = { backgroundColor: tokens.status.success };
  } else if (medium) {
    ringColor = { backgroundColor: tokens.status.warning };
  } else {
    ringColor = { backgroundImage: tokens.gradient };
  }

  let textColor: string;
  if (strong) {
    textColor = tokens.status.success;
  } else if (medium) {
    textColor = tokens.status.warning;
  } else {
    textColor = tokens.text.primary;
  }

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
        ...ringColor,
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
            color: textColor,
          }}
        >
          {score ?? '-'}
        </Typography>
      </Box>
    </Box>
  );
};
ScoreRing.displayName = 'ScoreRing';
