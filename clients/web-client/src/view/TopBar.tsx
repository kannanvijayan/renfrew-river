import { Box, Button, Typography } from "@mui/material";

import Application from "../application";
import RootState from "../state/root";
import SessionState from "../state/session";
import ViewState, { ViewMode } from "../state/view";
import ConnectedViewState from "../state/view/connected_view";
import { useRootDispatch } from "../store/hooks";

import "./TopBar.css";

export default function TopBar(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;

  return (
    <Box className="TopBar" sx={{ backgroundColor: "secondary.dark" }}>
      <TopBarPanel>
        <Logo />
      </TopBarPanel>
      <TopBarPanel>
        <ConnectionStatus viewState={viewState} />
      </TopBarPanel>
    </Box>
  );
}

function Logo() {
  return (
    <Typography className="Logo" variant="h3" color={"secondary.contrastText"}>
      Renfrew<br/>River
    </Typography>
  );
}

function ConnectionStatus(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;

  const dispatch = useRootDispatch();

  const disconnect = async () => {
    try {
      Application.cleanupInstance();
    } catch (err) {
      console.error("Failed to cleanup", err);
    } finally {
      dispatch(RootState.action.session(
        SessionState.action.setWsUrl(null)
      ));
      dispatch(RootState.action.view(
        ViewState.action.setMode(ViewMode.UNCONNECTED)
      ));
    }
  };

  return (
    <Box className="ConnectionStatus">
      <Typography className="ConnectedLabel" color={"secondary.contrastText"}>
        Connected
      </Typography>
      <Typography className="ConnectedUrl" color={"secondary.contrastText"}>
        {viewState.wsUrl}
      </Typography>
      <Button className="DisconnectButton" variant="contained"
        onClick={disconnect}>
        Disconnect
      </Button>
    </Box>
  );
}

function TopBarPanel(props: {
  children?: React.ReactNode,
  classNames?: string[],
}) {
  const classNames = [...(props.classNames ?? [])];
  classNames.unshift("TopBarPanel");
  return (
    <Box className={classNames.join(" ")}
      sx={{ backgroundColor: "secondary.main", color: "secondary.contrastText",
            borderColor: "primary.main", borderWidth: "5px" }}>
      {props.children}
    </Box>
  );
}
