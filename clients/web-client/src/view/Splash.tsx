import { useRootDispatch } from "../store/hooks";
import Button from "@mui/material/Button";

import { Box, Container, Input, Typography } from "@mui/material";

import ConnectedViewState from "../state/view/connected_view";
import UnconnectedViewState from "../state/view/unconnected_view";
import RootState from "../state/root";
import ViewState, { ViewMode } from "../state/view";

import Session from "../session/session";

import "./Splash.css";

export default function Splash(props: {
  viewState: UnconnectedViewState,
}) {
  const { viewState } = props;

  const dispatch = useRootDispatch();

  const connect = async () => {
    const wsUrl = viewState.wsUrlInput;
    try {
      // Connect to session.
      await Session.connectToServer(wsUrl);

      // Update view.
      dispatch(RootState.action.view(
        ViewState.action.setMode(ViewMode.CONNECTED)
      ));
      dispatch(RootState.action.view(
        ViewState.action.connected(
          ConnectedViewState.action.setWsUrl(wsUrl)
        )
      ));
    } catch (err) {
      console.error("Failed to connect to server", err);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(RootState.action.view(
      ViewState.action.unconnected(
        UnconnectedViewState.action.setWsUrlInput(event.target.value)
      )
    ));
  }

  const wsUrlInput = props.viewState.wsUrlInput;
  const validate = UnconnectedViewState.utility.validate;
  const valid = validate.wsUrlInput(wsUrlInput);

  return (
    <Container className="Splash" sx={{backgroundColor: "secondary.dark"}}>
      <form onSubmit={(e) => { e.preventDefault(); connect(); }}>
    <Box className="SplashBox" sx={{backgroundColor: "secondary.dark"}}>
      <Typography className="SplashTitle" variant="h1"
        color={"secondary.contrastText"}>
        Renfrew River
      </Typography>
      <Typography className="SplashSubtitle" variant="h4"
        color={"secondary.contrastText"}>
        A Simulation Game Engine
      </Typography>
      <Input className="SplashServerInput" placeholder="ws://..."
             defaultValue={wsUrlInput}
             onChange={onInputChange} />
      <Button type="submit" sx={{mx: "1rem"}} variant="contained" onClick={connect}
         disabled={!valid}>
          Connect
      </Button>
    </Box>
      </form>
    </Container>
  );
}
