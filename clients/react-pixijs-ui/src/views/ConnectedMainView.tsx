import { useRef, useState } from 'react';
import { Box, Button, Input, Typography } from '@mui/material';

import { GameSettings, GameSnapshot, SettingsLimits } from 'renfrew-river-protocol-client';

import GameServerSession from '../game/server_session';
import ViewState from '../ViewState';

import Screen from '../components/Screen';
import ConnectedTopBar from '../components/ConnectedTopBar';
import MainMenuFrame, { MainMenuLabeledEntry } from '../components/MainMenuFrame';

type ConnectedMainScreenViewMode =
  | "menu"
  | "new_game"
  | "load_game";

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

  const onLoadGameClicked = () => {
    setViewMode("load_game");
  };

  const onNewGameStartClicked = async (args: GameSettings) => {
    const instance = await props.session.serverStartNewGame(args);
    props.viewState.instance = instance;
  };

  const onLoadGameConfirm = async (contents: string) => {
    const game_snapshot: GameSnapshot = { data: contents }
    const instance = await props.session.serverLoadGameFromSnapshot(game_snapshot);
    props.viewState.instance = instance
  }

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
        onNewGameClicked={onNewGameClicked}
        onLoadGameClicked={onLoadGameClicked}
        onLoadGameConfirm={onLoadGameConfirm} />
    </Screen>
  );
};

function ViewMode(
  props: {
    mode: ConnectedMainScreenViewMode,
    settingsLimits: SettingsLimits,
    onNewGameClicked: () => void,
    onStartGameClicked: (args: GameSettings) => void,

    onLoadGameClicked: () => void,
    onLoadGameConfirm: (file: string) => void,
  }
) {
  switch (props.mode) {
    case "menu":
      return <ConnectedMainSelectionMenu
               onNewGameClicked={props.onNewGameClicked}
               onLoadGameClicked={props.onLoadGameClicked} />;
    case "new_game":
      return <ConnectedNewGameDialog settingsLimits={props.settingsLimits}
                onStartGameClicked={props.onStartGameClicked} />;
    case "load_game":
      return <ConnectedLoadGameDialog onLoadGameConfirm={props.onLoadGameConfirm} />;
  }
}

function ConnectedMainSelectionMenu(
  props: {
    onNewGameClicked: () => void,
    onLoadGameClicked: () => void,
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
        <Button variant="text" fullWidth onClick={props.onLoadGameClicked}>
          Load Game
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

function ConnectedLoadGameDialog(
  props: {
    onLoadGameConfirm: (ev: string) => void,
  }
) {
  const [validations, setValidations] = useState<Validations>({
    file: null,
    errors: [],
  });
  const filesRef = useRef<FileList|null>(null);

  type Validations = {
    file: string | null,
    errors: string[],
  };
  async function computeValidations(): Promise<Validations> {
    const files = filesRef.current;
    console.log("KVKV computeValidations files", files);
    const errors = [];
    if (!files || files.length == 0) {
      errors.push("No file selected");
    } else if (files && files.length > 1) {
      errors.push("Only one file allowed");
    } else {
      console.log("KVKV computeValidations read file", files[0]);
      const fileReader = new FileReader();
      return new Promise((resolve, reject) => {
        fileReader.onload = (ev) => {
          console.log("KVKV computeValidations fileReader.onLoad", ev);
          if (ev.target && ev.target.result) {
            const result = ev.target.result;
            if (typeof result !== "string") {
              errors.push("Invalid file contents");
              return;
            }
            resolve({ file: result, errors: [] });
          }
        };
        fileReader.onerror = (err) => {
          console.log("KVKV computeValidations fileReader.onError", err);
          reject(err);
        }
        fileReader.readAsText(files[0]);
      });
    }


    return {
      file: null,
      errors,
    };
  };

  const onClick = () => {
    const fileInput = document.getElementById("load-game-button-input");
    if (fileInput) {
      (fileInput as HTMLInputElement).click();
    }
  }

  const onFileChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (files) {
      filesRef.current = files;
      setValidations(await computeValidations());
    }
  };

  // Make a file upload dialog.
  return (
    (validations.errors.length > 0 || !validations.file)
      ? (
        <MainMenuFrame title="Load Game">
          <input
            id="load-game-button-input"
            type="file"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <label htmlFor="load-game-button-input">
            <Button variant="contained" color="primary" sx={{marginTop: "20px"}}
              onClick={onClick}>
              Upload File
            </Button>
          </label>
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
      )
      : (
        <MainMenuFrame title="Load Game">
          <Button variant="contained" color="primary" sx={{marginTop: "20px"}}
            onClick={_ev => props.onLoadGameConfirm(validations.file!)}>
            Load
          </Button>
        </MainMenuFrame>
      )
  );
}
