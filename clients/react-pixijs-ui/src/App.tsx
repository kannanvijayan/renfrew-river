
import { useRef } from 'react';

import './App.css';

import UnconnectedView from './views/UnconnectedView';
import ConnectedMainView from './views/ConnectedMainView';
import GameplayView from './views/GameplayView';

import {
  viewStateModeAtom,
  gameServerSessionAtom,
  gameInstanceAtom,
} from './view_state/ViewState';

import GameLoader from './game/loader';
import GameInstance from './game/instance';
import DefRulesView from './views/DefRulesView';
import { useAtom, useSetAtom } from 'jotai';

export default function App() {
  const [mode, setMode] = useAtom(viewStateModeAtom);
  const setGameServerSession = useSetAtom(gameServerSessionAtom);
  const setGameInstance = useSetAtom(gameInstanceAtom);

  const loaderRef = useRef<GameLoader>(GameLoader.getInstance());

  // When the user connects to a server, start the game.
  const onConnectClicked = async (server: string) => {
    const loader = loaderRef.current;
    loader.setOnDisconnect(() => {
      setGameServerSession(null);
      setGameInstance(null);
      setMode({ Unconnected: null });
    });

    // Establish a session with the server.
    const session = await loader.connectToServer(server);
    setGameServerSession(session);
    setMode({ Connected: { session } });

    // Check for existing game instance.
    const existingGame = await session.serverHasGameInstance();
    let instance: GameInstance | null = null;
    if (existingGame) {
      // Join the existing game automatically.
      instance = await session.serverJoinExistingGame();
      setGameInstance(instance);
      setMode({ Game: { instance } });
    }
  };

  const onDisconnectClicked = () => {
    const loader = loaderRef.current;
    loader.disconnectFromServer();
  };

  if ("Unconnected" in mode) {
    return (
      <UnconnectedView
        onConnectClicked={onConnectClicked}
      />
    )
  }

  if ("Connected" in mode) {
    return (
      <ConnectedMainView
        session={mode.Connected.session}
        onDisconnectClicked={onDisconnectClicked}
      />
    )
  }

  if ("Game" in mode) {
    return <GameplayView instance={mode.Game.instance} />;
  }
  if ("DefRules" in mode) {
    return <DefRulesView instance={mode.DefRules.instance} />;
  }
};
