import { Box, Button, Container, Typography } from '@mui/material';
import GameServerSession from '../game/server_session';

export default function ConnectedTopBar(
  props: {
    session: GameServerSession,
    onDisconnectClicked: () => void,
  }
) {
  console.log("ConnectedMainScreen", props);
  return (
    <Box display="flex" flexDirection="row" width="100%" height="auto"
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
        sx={{
          backgroundColor: 'secondary.light',
          boxShadow: 5,
          p: 1,
          height: 'auto',
        }}
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
    </Box>
  );
};
