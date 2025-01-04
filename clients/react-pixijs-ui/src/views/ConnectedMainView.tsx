import { useRef, useState } from 'react';
import { Box, Button, Input, Typography } from '@mui/material';

import { GameSettings, SettingsLimits } from 'renfrew-river-protocol-client';

import GameServerSession from '../game/server_session';
import ViewState from '../ViewState';

import Screen from '../components/Screen';
import ConnectedTopBar from '../components/ConnectedTopBar';
import MainMenuFrame, { MainMenuLabeledEntry } from '../components/MainMenuFrame';

type ConnectedMainScreenViewMode =
  | "menu"
  | "new_game";

// The main screen for the game when connected to a server.
// Shows a centered menu of selections.
export default function ConnectedMainView(
  props: {
    session: GameServerSession,
    viewState: ViewState,
    onDisconnectClicked: () => void,
  }
) {
  const [viewMode, setViewMode] = useState<ConnectedMainScreenViewMode>("menu");

  const onNewGameClicked = () => {
    setViewMode("new_game");
  };

  const onNewGameStartClicked = async (args: GameSettings) => {
    const instance = await props.session.serverStartNewGame(args);
    props.viewState.instance = instance;
  };

  return (
    <Screen>
      <ConnectedTopBar
        session={props.session}
        viewState={props.viewState}
        onDisconnectClicked={props.onDisconnectClicked}
      />
      <ViewMode
        mode={viewMode}
        settingsLimits={props.session.settingsLimits}
        onStartGameClicked={onNewGameStartClicked}
        onNewGameClicked={onNewGameClicked} />
    </Screen>
  );
};

function ViewMode(
  props: {
    mode: ConnectedMainScreenViewMode,
    settingsLimits: SettingsLimits,
    onStartGameClicked: (args: GameSettings) => void,
    onNewGameClicked: () => void,
  }
) {
  switch (props.mode) {
    case "menu":
      return <ConnectedMainSelectionMenu onNewGameClicked={props.onNewGameClicked} />;
    case "new_game":
      return <ConnectedNewGameDialog settingsLimits={props.settingsLimits}
                onStartGameClicked={props.onStartGameClicked} />;
  }
}

function ConnectedMainSelectionMenu(
  props: {
    onNewGameClicked: () => void,
  }
) {
  // Box is centered vertically.
  return (
    <Box display="flex" flexDirection="column"
      my="auto" boxShadow={5} p={1} width="400px"
      sx={{ backgroundColor: 'secondary.dark' }}
    >
      <Typography variant="h3" borderBottom={1} textAlign="center">
        Menu
      </Typography>
      <Box display="flex" flexDirection="column" p={1}>
        <Button variant="text" fullWidth onClick={props.onNewGameClicked}>
          New Game
        </Button>
      </Box>
    </Box>
  );
}

function ConnectedNewGameDialog(
  props: {
    settingsLimits: SettingsLimits,
    onStartGameClicked: (args: GameSettings) => void,
  }
) {
  const defaultSettings = props.settingsLimits.settings;

  const widthRef = useRef(`${defaultSettings.worldDims.columns}`);
  const heightRef = useRef(`${defaultSettings.worldDims.rows}`);
  const seedRef = useRef("1");

  type Validations = {
    width: boolean,
    height: boolean,
    seed: boolean,
    canCreate: GameSettings | null,
    errors: string[],
  };
  function computeValidations(): Validations {
    let widthValid = /^\d+$/.test(widthRef.current);
    let heightValid = /^\d+$/.test(heightRef.current);
    const seedValid = /^\d+$/.test(seedRef.current);
    const errors = [];

    const maxWorldDims = props.settingsLimits.maxWorldDims;
    const minWorldDims = props.settingsLimits.minWorldDims;

    if (!widthValid && widthRef.current !== "") {
      errors.push("Width must be a number");
    }
    if (!heightValid && heightRef.current !== "") {
      errors.push("Height must be a number");
    }
    if (!seedValid && seedRef.current !== "") {
      errors.push("Seed must be a number");
    }

    if (widthValid) {
      const width = parseInt(widthRef.current);
      if (width < minWorldDims.columns) {
        errors.push(`Width must be at least ${minWorldDims.columns}`);
        widthValid = false;
      }
      if (width > maxWorldDims.columns) {
        errors.push(`Width must be at most ${maxWorldDims.columns}`);
        widthValid = false;
      }
    }
    if (heightValid) {
      const height = parseInt(heightRef.current);
      if (height < minWorldDims.rows) {
        errors.push(`Height must be at least ${minWorldDims.rows}`);
        heightValid = false;
      }
      if (height > maxWorldDims.rows) {
        errors.push(`Height must be at most ${maxWorldDims.rows}`);
        heightValid = false;
      }
    }

    let canCreate: GameSettings | null = null;
    if (widthValid && heightValid && seedValid) {
      canCreate = {
        worldDims: {
          columns: parseInt(widthRef.current),
          rows: parseInt(heightRef.current),
        },
        randSeed: parseInt(seedRef.current),
      };
    }

    return {
      width: widthValid || widthRef.current === "",
      height: heightValid || heightRef.current === "",
      seed: seedValid || seedRef.current === "",
      canCreate,
      errors,
    };
  };

  const [validations, setValidations] = useState(computeValidations());

  const onChangeWidth = (e: React.ChangeEvent<HTMLInputElement>) => {
    widthRef.current = e.target.value;
    setValidations(computeValidations());
  };
  const onChangeHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
    heightRef.current = e.target.value;
    setValidations(computeValidations());
  };
  const onChangeSeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    seedRef.current = e.target.value;
    setValidations(computeValidations());
  };

  return (
    <MainMenuFrame title="New Game">
      <MainMenuLabeledEntry label="Width" targetId="new-game-width"
        isValid={validations.width}>
        <Input id="new-game-width" onChange={onChangeWidth}
          value={widthRef.current} />
      </MainMenuLabeledEntry>
      <MainMenuLabeledEntry label="Height" targetId="new-game-height"
        isValid={validations.height}>
        <Input id="new-game-height" onChange={onChangeHeight}
          value={heightRef.current}/>
      </MainMenuLabeledEntry>
      <MainMenuLabeledEntry label="Seed" targetId="new-game-seed"
        isValid={validations.seed}>
        <Input id="new-game-seed" onChange={onChangeSeed}
          value={seedRef.current} />
      </MainMenuLabeledEntry>
      <Button variant="contained" color="primary" sx={{marginTop: "20px"}}
        onClick={() => { props.onStartGameClicked(validations.canCreate!); }}
        disabled={validations.canCreate === null}
      >
        Start Game
      </Button>
      {
        validations.errors.length > 0
          ? (
              <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
                {
                  validations.errors.map((error, i) => (
                    <Typography key={i} color="error" fontSize="0.8em">
                      {error}
                    </Typography>
                  ))
                }
              </Box>
            )
          : null
      }
    </MainMenuFrame>
  );
}
