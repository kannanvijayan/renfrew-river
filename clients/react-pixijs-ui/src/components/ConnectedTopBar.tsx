import { Box, Button, Container, Typography } from '@mui/material';

import GameServerSession from '../game/server_session';
import GameInstance from '../game/instance';

import ViewState from '../ViewState';

import './ConnectedTopBar.css';

export default function ConnectedTopBar(
  props: {
    session: GameServerSession,
    onDisconnectClicked: () => void,
    viewState: ViewState,
  }
) {
  console.log("ConnectedMainScreen", props);
  const instance = props.viewState.instance;
  return (
    <Box display="flex" flexDirection="row" width="100%" height="auto"
      className="ConnectedTopBar"
      sx={{ backgroundColor: 'primary.dark' }}
    >
      <Container sx={{
        backgroundColor: 'primary.light',
        m: 0,
        marginRight: '10px',
        width: 'auto',
        height: 'auto',
        boxShadow: 5,
      }}>
        <Typography variant="h6" margin="auto">
          Renfrew River
        </Typography>
      </Container>
      <Box display="flex" flexDirection="column" height="auto"
        boxShadow={5} p={1} marginRight="10px"
        sx={{ backgroundColor: 'secondary.light' }}
      >
        <Typography variant="body1" sx={{ m: 0, textEmphasis: 'bolder' }}>
          Connected
        </Typography>
        <Typography variant="body2" sx={{ m: 1 }}>
          {props.session.serverAddr}
        </Typography>
        <Button variant="outlined" color="primary" size="small" 
          sx={{ m: 'auto', height: 'auto', width: '200px' }}
          onClick={props.onDisconnectClicked}
        >
          Disconnect
        </Button>
      </Box>
      { instance ? <ConnectedGameInfo instance={instance} /> : null }
    </Box>
  );
};


function ConnectedGameInfo(props: { instance: GameInstance }) {
  const worldDims = props.instance.settings.worldDims;
  return (
    <Box display="flex" flexDirection="column" height="auto"
      boxShadow={5} p={1}
      sx={{ backgroundColor: 'secondary.light' }}
    >
      <Typography variant="body1" sx={{ m: 0, textEmphasis: 'bolder' }}>
        Game On!
      </Typography>
      <Typography variant="body2" sx={{ m: 1 }}>
        {worldDims.columns}x{worldDims.rows}
      </Typography>
    </Box>
  );
}
