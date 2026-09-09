import { createTheme } from '@mui/material/styles';

// Aparna Saree Pre-Pleating - Dynamic 3-Theme Palette
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d4af37',
      light: '#e6d8a3',
      dark: '#9a7b1c',
      contrastText: '#000000',
    },
    secondary: {
      main: '#e6d8a3',
      light: '#e6d8a3',
      dark: '#d4af37',
      contrastText: '#000000',
    },
    background: {
      default: '#000000',
      paper: '#0f0f0f',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { color: 'var(--text-primary, #ffffff)', fontWeight: 700 },
    h2: { color: 'var(--text-primary, #ffffff)', fontWeight: 700 },
    h3: { color: 'var(--text-primary, #ffffff)', fontWeight: 700 },
    h4: { color: 'var(--text-primary, #ffffff)', fontWeight: 700 },
    h5: { color: 'var(--text-primary, #ffffff)', fontWeight: 600 },
    h6: { color: 'var(--text-primary, #ffffff)', fontWeight: 600 },
    body1: { color: 'var(--text-primary, #ffffff)' },
    body2: { color: 'var(--text-muted, #a1a1aa)' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          backgroundColor: 'var(--btn-primary-bg, #d4af37)',
          color: 'var(--btn-primary-text, #000000)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
          '&:hover': {
            filter: 'brightness(1.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          },
          '& .MuiSvgIcon-root': {
            color: 'var(--btn-primary-text, #000000) !important',
          },
        },
        outlinedPrimary: {
          borderColor: 'var(--surface-border-hover, rgba(212, 175, 55, 0.5))',
          color: 'var(--color-gold, #d4af37)',
          '&:hover': {
            borderColor: 'var(--color-gold, #d4af37)',
            color: 'var(--text-primary, #e6d8a3)',
            backgroundColor: 'var(--surface-gold-tint, rgba(212, 175, 55, 0.08))',
          },
          '& .MuiSvgIcon-root': {
            color: 'var(--color-gold, #d4af37) !important',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--bg-card, #0f0f0f)',
          borderColor: 'var(--surface-border, rgba(212, 175, 55, 0.22))',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--bg-card, #0f0f0f)',
          borderColor: 'var(--surface-border, rgba(212, 175, 55, 0.22))',
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: 'var(--surface-border, rgba(212, 175, 55, 0.4))',
          color: 'var(--text-primary, #e6d8a3)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: 'var(--color-gold, #d4af37)',
          borderRadius: 6,
          '&:hover': {
            backgroundColor: 'var(--surface-gold-tint, rgba(212, 175, 55, 0.1))',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'var(--surface-border, rgba(255, 255, 255, 0.12))',
          color: 'var(--text-primary, #ffffff)',
        },
        head: {
          color: 'var(--color-gold, #ffffff)',
          fontWeight: 700,
          borderColor: 'var(--surface-border, rgba(255, 255, 255, 0.12))',
          backgroundColor: 'var(--table-head-bg, #0a0a0a)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarColor: 'var(--scrollbar-thumb-color, #d4af37) var(--scrollbar-track, #050505)',
          scrollbarWidth: 'thin',
        },
        body: {
          scrollbarColor: 'var(--scrollbar-thumb-color, #d4af37) var(--scrollbar-track, #050505)',
          scrollbarWidth: 'thin',
        },
        '*::-webkit-scrollbar': {
          width: '7px',
          height: '7px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'var(--scrollbar-track, #050505)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'var(--scrollbar-thumb-bg, var(--scrollbar-thumb-color, #d4af37))',
          backgroundColor: 'var(--scrollbar-thumb-color, #d4af37)',
          borderRadius: '6px',
          '&:hover': {
            background: 'var(--scrollbar-thumb-hover, #e6d8a3)',
            backgroundColor: 'var(--scrollbar-thumb-hover, #e6d8a3)',
          },
        },
        '*::-webkit-scrollbar-corner': {
          background: 'var(--scrollbar-track, #000000)',
        },
      },
    },
  },
});

export default theme;
