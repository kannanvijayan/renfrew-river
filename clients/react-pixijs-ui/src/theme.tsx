import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#c58b29',
    },
    secondary: {
      main: '#29c58b',
    },
    error: {
      main: red.A400,
    },
    // Create a gradient background from white to black.
    background: {
      default: '#c58b29',
    },
  },
});

export default theme;
