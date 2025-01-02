
import { useRef } from 'react';

import './App.css';
import GameLoader from './game/loader';
import UnconnectedScreen from './components/UnconnectedScreen';
import ConnectedMainScreen from './components/ConnectedMainScreen';
import { useGameState } from './game/state';

export default function App() {
  const loaderRef = useRef<GameLoader>(GameLoader.getInstance());
  const gameState = useGameState();

  // When the user connects to a server, start the game.
  const onConnectClicked = (server: string) => {
    const loader = loaderRef.current;
    loader.connectToServer(server).then((session) => {
      gameState.serverSession = session;
    });
    loader.setOnDisconnect(() => {
      gameState.serverSession = null
    })
  };

  const onDisconnectClicked = () => {
    const loader = loaderRef.current;
    loader.disconnectFromServer();
  };

  const session = gameState.serverSession;

  return (
    session === null
      ? <UnconnectedScreen onConnectClicked={onConnectClicked} />
      : <ConnectedMainScreen session={session}
          onDisconnectClicked={onDisconnectClicked} />
  );
};
