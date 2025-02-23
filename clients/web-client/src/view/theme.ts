import { createTheme } from "@mui/material";

const DefaultTheme = createTheme({
  cssVariables: true,
  palette: {
    background: {
      // default: "#181610",
      default: "#222014",
    },
    primary: {
      main: "#662222",
      contrastText: "#eecccc",
    },
    secondary: {
      main: "#ccaa66",
      // contrastText: "#ffddaa",
      contrastText: "#773326",
    },
    success: {
      main: "#669922",
      contrastText: "#ddffbb",
    }
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        maxWidthLg: {
          maxWidth: "10000px",
        },
        maxWidthSm: {
          maxWidth: "10000px",
        },
        maxWidthMd: {
          maxWidth: "10000px",
        },
        maxWidthXl: {
          maxWidth: "10000px",
        },
        maxWidthXs: {
          maxWidth: "10000px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          "&.Mui-disabled": {
            color: "#c84",
            backgroundColor: "#864",
          }
        },
      },
    }
  }
});

export {
  DefaultTheme,
};
