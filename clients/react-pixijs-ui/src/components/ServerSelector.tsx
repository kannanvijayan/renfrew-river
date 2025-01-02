import { Box, Button, Input, Typography } from '@mui/material';
import React from 'react';

// Accepts a callback function to call when "Connect" button is clicked.
export default function ServerSelector(
  props: {
    onConnectClicked: (serverAddress: string) => void,
  }
) {

  const serverAddrRef = React.useRef<string>("");

  const connectClicked = () => {
    props.onConnectClicked(serverAddrRef.current);
  };

  const serverAddressChanged = (value: string) => {
    serverAddrRef.current = value;
  };

  return (
    /* Make a vertical layout of a title, a labeled server selector input,
     * and a connect button.
     */
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: "secondary.light", p: 4, borderRadius: 1,
      m: 4, boxShadow: 3,
    }} width="fit-content">

      { /* Title */ }
      <Typography variant="h5" sx={{ mb: 2 }} color="textSecondary">
        Connect to server
      </Typography>

      { /* Server selector input (horizontal box) */ }
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Typography
          variant="body2" component="label" htmlFor="ws-server-input"
          sx={{ mr: 2 }}
        >
          Server:
        </Typography>
        { /* <input type="text" id="ws-server-input" /> */ }
        <Input ref={serverAddrRef} id="ws-server-input"
          onChange={e => { serverAddressChanged(e.target.value); }} />
      </Box>

      { /* Connect button */ }
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={connectClicked}>
          Connect
        </Button>
      </Box>
    </Box>
  );
};
