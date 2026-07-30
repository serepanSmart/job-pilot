export const tokens = {
  surface: {
    base: '#0B0910',
    paper: '#141020',
    elevated: '#1C1729',
  },
  primary: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#6D28D9',
    contrastText: '#FFFFFF',
  },
  text: {
    primary: '#EDEAF6',
    secondary: '#9B94B3',
    disabled: '#5A5470',
  },
  status: {
    success: '#34D399',
    warning: '#FBBF24',
    error: '#FB7185',
    info: '#60A5FA',
  },
  gradient: 'linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)',
  border: {
    subtle: 'rgba(139, 92, 246, 0.12)',
    hover: 'rgba(139, 92, 246, 0.35)',
  },
  glow: '0 0 24px rgba(124, 58, 237, 0.15)',
  chipFill: 'rgba(139, 92, 246, 0.08)',
  scrollThumb: 'rgba(139, 92, 246, 0.25)',
  appBarBg: 'rgba(11, 9, 16, 0.7)',
  transition: '150ms ease',
  radius: 12,
} as const;

export const alertFill = {
  success: 'rgba(52, 211, 153, 0.08)',
  warning: 'rgba(251, 191, 36, 0.08)',
  error: 'rgba(251, 113, 133, 0.08)',
  info: 'rgba(96, 165, 250, 0.08)',
} as const;
