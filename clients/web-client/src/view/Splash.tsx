import { useAppDispatch } from "../store/hooks";
import Button from "@mui/material/Button";

import { Box, Container, Input, Typography } from "@mui/material";

import ConnectedViewState, { ConnectedViewMode } from "../state/view/connected_view";
import UnconnectedViewState from "../state/view/unconnected_view";
import ViewState, { ViewMode } from "../state/view";

import Session from "../session/session";

import "./Splash.css";
import DefineRulesViewState from "../state/view/define_rules";

export default function Splash(props: {
  viewState: UnconnectedViewState,
}) {
  const { viewState } = props;

  const dispatchView = useAppDispatch.view();
  const dispatchConnected = useAppDispatch.view.connected();
  const dispatchUnconnected = useAppDispatch.view.unconnected();

  const connect = async () => {
    const wsUrl = viewState.wsUrlInput;
    try {
      // Connect to session.
      const session = await Session.connectToServer(wsUrl);

      // Get the session, and check the current mode.
      const modeInfo = await session.gameModeInfo();

      // Update view.
      dispatchView(ViewState.action.setMode(ViewMode.CONNECTED));
      dispatchConnected(ConnectedViewState.action.setWsUrl(wsUrl));
      const viewMode = (modeInfo === null)
        ? ConnectedViewMode.MAIN_MENU
        : ConnectedViewMode.DEFINE_RULES;
      dispatchConnected(ConnectedViewState.action.setViewMode(viewMode));
      dispatchConnected(ConnectedViewState.action.setDefineRules(
        DefineRulesViewState.initialState
      ));
      if (viewMode === ConnectedViewMode.DEFINE_RULES) {
        session.defineRules.view.bumpValidationTimeout();
      }
    } catch (err) {
      console.error("Failed to connect to server", err);
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatchUnconnected(
      UnconnectedViewState.action.setWsUrlInput(event.target.value)
    );
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
