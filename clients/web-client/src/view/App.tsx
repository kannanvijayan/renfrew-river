import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";

import { useRootSelector } from "../store/hooks";

import { DefaultTheme } from "./theme";
import "./App.css"

import Splash from "./Splash";
import ConnectedMain from "./connected/ConnectedMain";
import { ViewMode } from "../state/view";

export default function App() {
  const { view, session } = useRootSelector((state) => {
    return { view: state.view, session: state.session };
  });

  return (
    <ThemeProvider theme={DefaultTheme}>
      < CssBaseline />
      {content()}
    </ThemeProvider>
  );

  function content() {
    if (view.mode === ViewMode.UNCONNECTED) {
      return <Splash viewState={view.unconnected} />;
    } else {
      return <ConnectedMain viewState={view.connected} sessionState={session} />;
    }
  }
}
