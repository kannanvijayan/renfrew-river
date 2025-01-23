import { useState } from 'react';
import { Box, Button, Container, Menu, MenuItem, Typography } from '@mui/material';

import GameServerSession from '../game/server_session';
import GameInstance from '../game/instance';

import { gameInstanceAtom } from '../view_state/ViewState';

import './ConnectedTopBar.css';
import DefRulesGameMode from '../game/mode/def_rules';
import { useAtomValue } from 'jotai';

export default function ConnectedTopBar(
  props: {
    session: GameServerSession,
    onDisconnectClicked: () => void,
  }
) {
  const { session, onDisconnectClicked } = props;

  const instance = useAtomValue(gameInstanceAtom);
  return (
    <Box display="flex" flexDirection="row" width="100%" height="auto"
      className="ConnectedTopBar" mt={1}
      sx={{ backgroundColor: 'primary.dark' }}
    >
      <GameEmblem />

      <ConnectionInfo serverAddr={session.serverAddr}
          onDisconnectClicked={onDisconnectClicked} />

      {instance ? <ModeSpecificInfo instance={instance} /> : null}
    </Box>
  );
};

function ModeSpecificInfo(props: { instance: GameInstance | DefRulesGameMode }) {
  const { instance } = props;
  if (instance instanceof GameInstance) {
    return (
      <>
        <ConnectedGameInfo instance={instance} />
        <GameMenuButton instance={instance} />
      </>
    );
  }
}

function GameEmblem() {
  return (
      <Container sx={{
        backgroundColor: 'primary.light',
        m: 0,
        ml: 1,
        marginRight: '10px',
        width: 'auto',
        height: 'auto',
        boxShadow: 5,
      }}>
        <Typography variant="h6" margin="auto">
          Renfrew River
        </Typography>
      </Container>
  );
}


function ConnectionInfo(props: {
  serverAddr: string,
  onDisconnectClicked: () => void,
}) {
  return (
    <Box display="flex" flexDirection="column" height="auto"
      boxShadow={5} p={1} marginRight="10px"
      sx={{ backgroundColor: 'secondary.light' }}
    >
      <Typography variant="body1" sx={{ m: 0, textEmphasis: 'bolder' }}>
        Connected
      </Typography>
      <Typography variant="body2" sx={{ m: 1 }}>
        {props.serverAddr}
      </Typography>
      <Button variant="outlined" color="primary" size="small" 
        sx={{ m: 'auto', height: 'auto', width: '200px' }}
        onClick={props.onDisconnectClicked}
      >
        Disconnect
      </Button>
    </Box>
  );
}


function ConnectedGameInfo(props: { instance: GameInstance }) {
  const worldDims = props.instance.settings.worldDims;
  return (
    <Box display="flex" flexDirection="column" height="auto"
      boxShadow={5} p={1} marginRight="10px"
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

function GameMenuButton(props: { instance: GameInstance }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSaveGameClicked = async () => {
    console.log("Save Game clicked");
    const gameSnapshot = await props.instance.snapshotGame();
    console.log("KVKV gameSnapshot", gameSnapshot);
    // Start a file download with the given string contents.
    const blob = new Blob([gameSnapshot.data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game_snapshot.json";
    a.click();
  };
  const handleLoadGameClicked = () => {
    console.log("Load Game clicked");
  }
  const handleStopGameClicked = () => {
    console.log("Stop Game clicked");
  }

  return (
    <Container sx={{
      backgroundColor: 'secondary.light',
      m: 0,
      marginRight: '10px',
      width: 'auto',
      height: 'auto',
      boxShadow: 5,
    }}>
      <Button variant="contained" color="primary" size="small" 
        sx={{ m: 'auto', mt: '10px', height: 'auto', width: '200px' }}
        onClick={handleClick}
        id="game-menu-button"
      >
        Menu
      </Button>
      <GameMenu onClose={handleClose} anchorEl={anchorEl}
        onSaveGameClicked={handleSaveGameClicked}
        onLoadGameClicked={handleLoadGameClicked}
        onStopGameClicked={handleStopGameClicked} />
    </Container>
  );
}

function GameMenu(props: {
  onClose: () => void,
  anchorEl: HTMLElement | null,
  onSaveGameClicked: () => void,
  onLoadGameClicked: () => void,
  onStopGameClicked: () => void,
}) {
  return (
    <Menu
      anchorEl={props.anchorEl}
      open={!!props.anchorEl}
      onClose={props.onClose}
      MenuListProps={{ 'aria-labelledby': 'game-menu-button' }}
    >
      <GameMenuItem name="Save Game" onClick={props.onSaveGameClicked} />
      <GameMenuItem name="Load Game" onClick={props.onLoadGameClicked} />
      <GameMenuItem name="Stop Game" onClick={props.onStopGameClicked} />
    </Menu>
  );
}

function GameMenuItem(props: {
  name: string,
  onClick: () => void,
}) {
  return (
    <Container>
      <MenuItem onClick={props.onClick}>
       {props.name}
      </MenuItem>
      </Container>
  );
}
