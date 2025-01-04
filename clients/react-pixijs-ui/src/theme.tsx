import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      // main: '#c58b29',
      main: '#ccf084',
    },
    secondary: {
      // main: '#29c58b',
      main: '#84a7f0',
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
