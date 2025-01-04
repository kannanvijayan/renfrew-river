import React from 'react';
import { Box, Button, Input } from '@mui/material';

import MainMenuFrame, { MainMenuLabeledEntry } from './MainMenuFrame';

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
    <MainMenuFrame title="Connect to server">
      { /* Server selector input (horizontal box) */ }
      <MainMenuLabeledEntry label="Server" targetId="ws-server-input">
        <Input ref={serverAddrRef} id="ws-server-input"
          onChange={e => { serverAddressChanged(e.target.value); }}
          onKeyUp={e => { if (e.key === "Enter") { connectClicked(); } }}
        />
      </MainMenuLabeledEntry>

      { /* Connect button */ }
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={connectClicked}>
          Connect
        </Button>
      </Box>
    </MainMenuFrame>
  );
};
