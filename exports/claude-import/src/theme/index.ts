import { createTheme } from '@mui/material/styles'

// Sunzi Cerebro Design System Colors
export const colors = {
  primary: {
    main: '#00327c',      // Dark blue
    light: '#3e94ff',     // Main brand blue
    dark: '#001e52',
  },
  secondary: {
    main: '#404040',      // Text gray
    light: '#99adcb',     // Light blue
    dark: '#2a2a2a',
  },
  error: {
    main: '#fb5454',      // Brand red
    light: '#fca5a5',
    dark: '#c94343',
  },
  warning: {
    main: '#ff9b26',      // Brand orange
    light: '#fc9d5a',
    dark: '#cc7c1e',
  },
  success: {
    main: '#00ca82',      // Brand green
    light: '#86efac',
    dark: '#00794e',
  },
  info: {
    main: '#2a76d1',      // Secondary blue
    light: '#b4d6ff',
    dark: '#00286a',
  },
  background: {
    default: '#f8faff',
    paper: '#ffffff',
  },
  text: {
    primary: '#404040',
    secondary: '#99adcb',
  },
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    success: colors.success,
    info: colors.info,
    background: colors.background,
    text: colors.text,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: '2.5rem',
      color: colors.text.primary,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: '2.25rem',
      color: colors.text.primary,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: '2rem',
      color: colors.text.primary,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: '1.75rem',
      color: colors.text.primary,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: '1.75rem',
      color: colors.text.primary,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: '1.5rem',
      color: colors.text.primary,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.375rem',
      color: colors.text.primary,
    },
    body2: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: '1.125rem',
      color: colors.text.primary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    // Button Overrides
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    
    // Card Overrides
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          transition: 'box-shadow 0.2s ease-in-out',
        },
      },
    },
    
    // AppBar Overrides
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          color: colors.text.primary,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    
    // Paper Overrides
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiPaper-elevation1': {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
          '&.MuiPaper-elevation2': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          '&.MuiPaper-elevation3': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    
    // TextField Overrides
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.light,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
    
    // Chip Overrides
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
        },
      },
    },
    
    // LinearProgress Overrides
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          backgroundColor: '#e5e5e5',
        },
        bar: {
          borderRadius: '4px',
        },
      },
    },
    
    // Avatar Overrides
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})

export default theme