import { useEffect, useRef } from 'react';

import GameInstance from '../game/instance';

import ViewState from '../ViewState';

import Screen from '../components/Screen';
import ConnectedTopBar from '../components/ConnectedTopBar';
import WorldCanvas from '../components/WorldCanvas';

// The main screen for the game when connected to a server.
// Shows a centered menu of selections.
export default function GameplayView(
  props: {
    instance: GameInstance,
    viewState: ViewState,
  }
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // When the browser window changes size, resize the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }
    props.instance.handleCanvasMounted(canvas);
  });

  return (
    <Screen>
      <ConnectedTopBar
        session={props.instance.serverSession}
        viewState={props.viewState}
        onDisconnectClicked={() => {}}
      />
      <WorldCanvas canvasRef={canvasRef} />
    </Screen>
  );
};
