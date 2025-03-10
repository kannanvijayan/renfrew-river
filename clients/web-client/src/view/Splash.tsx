import Button from "@mui/material/Button";
import { Box, Container, Input, Typography } from "@mui/material";

import UnconnectedViewState from "../state/view/unconnected_view";
import { useAppDispatch } from "../store/hooks";

import "./Splash.css";
import Application from "../application";

export default function Splash(props: {
  viewState: UnconnectedViewState,
}) {
  const { viewState } = props;

  const dispatchUnconnected = useAppDispatch.view.unconnected();

  const connect = () => {
    return Application.getInstance().initSession(viewState.wsUrlInput);
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
