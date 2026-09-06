import { createTheme } from '@mui/material/styles';

// Aparna Saree Pre-Pleating - Exclusive Luxury Palette: #000000, #d4af37, #e6d8a3
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
      primary: '#e6d8a3',
      secondary: '#d4af37',
    },
    divider: 'rgba(212, 175, 55, 0.22)',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { color: '#e6d8a3', fontWeight: 700 },
    h2: { color: '#e6d8a3', fontWeight: 700 },
    h3: { color: '#e6d8a3', fontWeight: 700 },
    h4: { color: '#e6d8a3', fontWeight: 700 },
    h5: { color: '#e6d8a3', fontWeight: 600 },
    h6: { color: '#e6d8a3', fontWeight: 600 },
    body1: { color: '#e6d8a3' },
    body2: { color: 'rgba(230, 216, 163, 0.8)' },
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
          backgroundColor: '#d4af37',
          color: '#000000',
          boxShadow: '0 2px 10px rgba(212, 175, 55, 0.25)',
          '&:hover': {
            backgroundColor: '#e6d8a3',
            color: '#000000',
            boxShadow: '0 4px 16px rgba(212, 175, 55, 0.4)',
          },
          '& .MuiSvgIcon-root': {
            color: '#000000 !important',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(212, 175, 55, 0.5)',
          color: '#d4af37',
          '&:hover': {
            borderColor: '#d4af37',
            color: '#e6d8a3',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
          },
          '& .MuiSvgIcon-root': {
            color: '#d4af37 !important',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f0f0f',
          borderColor: 'rgba(212, 175, 55, 0.22)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f0f0f',
          borderColor: 'rgba(212, 175, 55, 0.22)',
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(212, 175, 55, 0.4)',
          color: '#e6d8a3',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#d4af37',
          borderRadius: 6,
          '&:hover': {
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgb(32 28 16)',
            borderRadius: 10,
          },
          '&.Mui-selected': {
            backgroundColor: 'rgb(32 28 16)',
            borderRadius: 10,
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarColor: 'rgba(212, 175, 55, 0.45) #050505',
          scrollbarWidth: 'thin',
        },
        body: {
          scrollbarColor: 'rgba(212, 175, 55, 0.45) #050505',
          scrollbarWidth: 'thin',
        },
        '*::-webkit-scrollbar': {
          width: '7px',
          height: '7px',
        },
        '*::-webkit-scrollbar-track': {
          background: '#050505',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(180deg, #d4af37 0%, #9a7b1c 100%)',
          borderRadius: '6px',
          border: '1px solid rgba(0, 0, 0, 0.7)',
          boxShadow: '0 0 6px rgba(212, 175, 55, 0.35)',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'linear-gradient(180deg, #e6d8a3 0%, #d4af37 100%)',
          boxShadow: '0 0 10px rgba(212, 175, 55, 0.7)',
        },
        '*::-webkit-scrollbar-corner': {
          background: '#000000',
        },
      },
    },
  },
});


export default theme;
