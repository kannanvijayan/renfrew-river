
import { useRef } from 'react';

import './App.css';

import UnconnectedView from './views/UnconnectedView';
import ConnectedMainView from './views/ConnectedMainView';
import GameplayView from './views/GameplayView';

import { useViewState } from './ViewState';

import GameLoader from './game/loader';
import GameInstance from './game/instance';
import DefRulesGameMode from './game/mode/def_rules';
import DefRulesView from './views/DefRulesView';

export default function App() {
  const viewState = useViewState();
  const loaderRef = useRef<GameLoader>(GameLoader.getInstance());

  // When the user connects to a server, start the game.
  const onConnectClicked = async (server: string) => {
    const loader = loaderRef.current;
    loader.setOnDisconnect(() => {
      viewState.serverSession = null
    });

    // Establish a session with the server.
    const session = await loader.connectToServer(server);
    viewState.serverSession = session;

    // Check for existing game instance.
    const existingGame = await session.serverHasGameInstance();
    let instance: GameInstance | null = null;
    if (existingGame) {
      // Join the existing game automatically.
      instance = await session.serverJoinExistingGame();
      viewState.instance = instance;
    }
  };

  const onDisconnectClicked = () => {
    const loader = loaderRef.current;
    loader.disconnectFromServer();
  };

  const session = viewState.serverSession;
  const instance = viewState.instance;

  if (session === null) {
    return (
      <UnconnectedView
        onConnectClicked={onConnectClicked}
        viewState={viewState}
      />
    )
  }

  if (instance === null) {
    return (
      <ConnectedMainView
        session={session}
        viewState={viewState}
        onDisconnectClicked={onDisconnectClicked}
      />
    )
  }

  if (instance instanceof GameInstance) {
    return <GameplayView instance={instance} viewState={viewState} />;
  } else if (instance instanceof DefRulesGameMode) {
    return <DefRulesView instance={instance} viewState={viewState} />;
  }
};
