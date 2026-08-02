import { createTheme } from '@mui/material/styles';
import NextLink from 'next/link';
import { alertFill, tokens } from './tokens';

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  defaultColorScheme: 'dark',
  colorSchemes: {
    dark: {
      palette: {
        mode: 'dark',
        background: {
          default: tokens.surface.base,
          paper: tokens.surface.paper,
        },
        primary: tokens.primary,
        text: tokens.text,
        success: { main: tokens.status.success },
        warning: { main: tokens.status.warning },
        error: { main: tokens.status.error },
        info: { main: tokens.status.info },
        divider: tokens.border.subtle,
      },
    },
  },

  shape: { borderRadius: tokens.radius },

  typography: {
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    h1: {
      fontFamily: 'var(--font-sora)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: 'var(--font-sora)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: 'var(--font-sora)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: 'var(--font-sora)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: 'var(--font-sora)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontFamily: 'var(--font-sora)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: { textTransform: 'none', fontWeight: 500 },
  },

  components: {
    MuiButtonBase: {
      defaultProps: { LinkComponent: NextLink },
    },

    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        body: {
          backgroundColor: tokens.surface.base,
          scrollbarWidth: 'thin',
          scrollbarColor: `${tokens.scrollThumb} transparent`,
        },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: tokens.scrollThumb,
          borderRadius: 4,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: tokens.border.hover,
        },
        ':focus-visible': {
          outline: `2px solid ${tokens.primary.light}`,
          outlineOffset: 2,
        },
        kbd: {
          display: 'inline-block',
          padding: '1px 5px',
          borderRadius: 4,
          fontSize: '0.75em',
          fontFamily: 'ui-monospace, monospace',
          color: tokens.text.secondary,
          background: tokens.surface.elevated,
          border: `1px solid ${tokens.border.hover}`,
          lineHeight: 1.5,
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.surface.paper,
          border: `1px solid ${tokens.border.subtle}`,
          borderRadius: tokens.radius,
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.surface.paper,
          border: `1px solid ${tokens.border.subtle}`,
          borderRadius: tokens.radius,
          transition: `border-color ${tokens.transition}, box-shadow ${tokens.transition}`,
        },
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: {
            '&:hover, &[data-selected="true"]': {
              borderColor: tokens.border.hover,
              boxShadow: tokens.glow,
            },
          },
        },
      ],
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 22,
          '&:last-child': { paddingBottom: 22 },
        },
      },
      variants: [
        {
          props: { compact: true },
          style: { padding: '16px', '&:last-child': { paddingBottom: '16px' } },
        },
        {
          props: { dense: true },
          style: { padding: '14px', '&:last-child': { paddingBottom: '14px' } },
        },
      ],
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.appBarBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: `1px solid ${tokens.border.subtle}`,
          borderRadius: 0,
        },
      },
    },

    MuiChip: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: {
          backgroundColor: tokens.chipFill,
          borderColor: tokens.border.subtle,
          color: tokens.text.secondary,
        },
      },
      variants: [
        {
          props: { color: 'success' },
          style: {
            borderColor: tokens.status.success,
            color: tokens.status.success,
            backgroundColor: alertFill.success,
          },
        },
        {
          props: { color: 'warning' },
          style: {
            borderColor: tokens.status.warning,
            color: tokens.status.warning,
            backgroundColor: alertFill.warning,
          },
        },
        {
          props: { color: 'default' },
          style: {
            borderColor: tokens.border.subtle,
            color: tokens.text.disabled,
            backgroundColor: 'transparent',
          },
        },
      ],
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10 },
        outlined: {
          borderColor: tokens.border.hover,
          '&:hover': {
            borderColor: tokens.primary.light,
            backgroundColor: tokens.chipFill,
          },
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundImage: tokens.gradient,
            color: tokens.primary.contrastText,
            '&:hover': {
              backgroundImage: tokens.gradient,
              filter: 'brightness(1.08)',
            },
          },
        },
      ],
    },

    MuiAlert: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: tokens.radius, backgroundImage: 'none' },
      },
      variants: [
        {
          props: { severity: 'success' },
          style: {
            backgroundColor: alertFill.success,
            border: `1px solid ${tokens.status.success}`,
            color: tokens.text.primary,
          },
        },
        {
          props: { severity: 'warning' },
          style: {
            backgroundColor: alertFill.warning,
            border: `1px solid ${tokens.status.warning}`,
            color: tokens.text.primary,
          },
        },
        {
          props: { severity: 'error' },
          style: {
            backgroundColor: alertFill.error,
            border: `1px solid ${tokens.status.error}`,
            color: tokens.text.primary,
          },
        },
        {
          props: { severity: 'info' },
          style: {
            backgroundColor: alertFill.info,
            border: `1px solid ${tokens.status.info}`,
            color: tokens.text.primary,
          },
        },
      ],
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.surface.elevated,
          border: `1px solid ${tokens.border.subtle}`,
          fontSize: 12,
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface.base,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.border.subtle,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.border.hover,
          },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: { backgroundColor: tokens.surface.elevated },
      },
    },

    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.surface.elevated,
          border: `1px solid ${tokens.border.subtle}`,
          color: tokens.text.primary,
          borderRadius: tokens.radius,
        },
      },
    },

    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: { color: tokens.primary.light },
      },
    },
  },
});
