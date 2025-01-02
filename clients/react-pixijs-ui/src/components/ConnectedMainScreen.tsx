import GameServerSession from '../game/server_session';
import Screen from './Screen';
import ConnectedTopBar from './ConnectedTopBar';

export default function ConnectedMainScreen(
  props: {
    session: GameServerSession,
    onDisconnectClicked: () => void,
  }
) {
  console.log("ConnectedMainScreen", props);
  return (
    <Screen>
      <ConnectedTopBar
        session={props.session}
        onDisconnectClicked={props.onDisconnectClicked}
      />
    </Screen>
  );
};
