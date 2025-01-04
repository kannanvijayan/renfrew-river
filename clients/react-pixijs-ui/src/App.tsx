
import { useRef } from 'react';

import './App.css';

import UnconnectedView from './views/UnconnectedView';
import ConnectedMainView from './views/ConnectedMainView';
import GameplayView from './views/GameplayView';

import { useViewState } from './ViewState';

import GameLoader from './game/loader';
import GameInstance from './game/instance';

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

  return (
    session === null ?
      <UnconnectedView onConnectClicked={onConnectClicked} viewState={viewState}/>
    : instance === null ?
      <ConnectedMainView session={session}
        viewState={viewState}
        onDisconnectClicked={onDisconnectClicked} />
    : <GameplayView instance={instance} viewState={viewState} />
  );
};
