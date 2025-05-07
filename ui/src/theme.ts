import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { trTR } from '@mui/material/locale';

// Modern renk paleti
const primaryColor = '#3a7bd5';
const secondaryColor = '#00d2ff';
const successColor = '#00c853';
const errorColor = '#f44336';
const warningColor = '#ff9800';
const infoColor = '#2196f3';
const backgroundColor = '#f8f9fa';
const paperColor = '#ffffff';
const textPrimaryColor = '#2d3748';
const textSecondaryColor = '#718096';

// Tema oluşturma
let theme = createTheme(
  {
    palette: {
      mode: 'light',
      primary: {
        main: primaryColor,
        light: '#6ea8ff',
        dark: '#0051a2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryColor,
        light: '#6effff',
        dark: '#00a0cc',
        contrastText: '#ffffff',
      },
      success: {
        main: successColor,
        light: '#5efc82',
        dark: '#009624',
        contrastText: '#ffffff',
      },
      error: {
        main: errorColor,
        light: '#ff7961',
        dark: '#ba000d',
        contrastText: '#ffffff',
      },
      warning: {
        main: warningColor,
        light: '#ffc947',
        dark: '#c66900',
        contrastText: '#ffffff',
      },
      info: {
        main: infoColor,
        light: '#6ec6ff',
        dark: '#0069c0',
        contrastText: '#ffffff',
      },
      background: {
        default: backgroundColor,
        paper: paperColor,
      },
      text: {
        primary: textPrimaryColor,
        secondary: textSecondaryColor,
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1rem',
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '0.875rem',
      },
      body1: {
        fontWeight: 400,
        fontSize: '1rem',
      },
      body2: {
        fontWeight: 400,
        fontSize: '0.875rem',
      },
      button: {
        fontWeight: 500,
        fontSize: '0.875rem',
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 10px 0 rgba(58, 123, 213, 0.1)',
            backgroundImage: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            padding: '8px 16px',
            '&:hover': {
              boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: 12,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: 12,
          },
          elevation1: {
            boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.05)',
          },
          elevation2: {
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            padding: '16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: 'rgba(58, 123, 213, 0.05)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minWidth: 'auto',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(180deg, rgba(58, 123, 213, 0.03) 0%, rgba(0, 210, 255, 0.03) 100%)',
            borderRight: 'none',
            boxShadow: '1px 0 10px 0 rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: 'rgba(58, 123, 213, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(58, 123, 213, 0.15)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(58, 123, 213, 0.05)',
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 40,
            color: textSecondaryColor,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            borderRadius: 8,
          },
        },
      },
    },
  },
  trTR // Türkçe dil desteği
);

// Responsive font sizes
theme = responsiveFontSizes(theme);

export default theme;
