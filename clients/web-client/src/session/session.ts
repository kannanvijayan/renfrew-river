import GameClient, { GameModeInfo } from "renfrew-river-protocol-client";

import { store } from "../store/root";
import RootState from "../state/root";
import SessionState from "../state/session";
import ViewState, { ViewMode } from "../state/view";

import WsTransport from "../session/ws_transport";
import { DefineRulesModule } from "../session/define_rules";
import { CreateWorldModule } from "../session/create_world";
import { dispatchApp } from "../store/dispatch";
import ConnectedViewState, { ConnectedViewMode } from "../state/view/connected_view";

/**
 * The behavioural logic for maintaining a client connection (session)
 * to the server.
 */
export default class Session {
  public readonly serverAddr: string;
  public readonly client: GameClient;

  public readonly defineRules: DefineRulesModule;
  public readonly createWorld: CreateWorldModule;

  public static async connectToServer(serverAddr: string): Promise<Session> {
    const resetViewState = () => {
      store.dispatch(RootState.action.view(
        ViewState.action.setMode(ViewMode.UNCONNECTED)
      ));
    };

    const ws = new WebSocket(serverAddr);
    const transport = new WsTransport(ws);
    const client = await new Promise<GameClient>(resolve => {
      const client = new GameClient({
        transport,
        callbacks: {
          onConnect: () => resolve(client),
          onError: (err) => {
            console.error("Session: Failed to connect to server", err);
            resetViewState();
          },
          onClose: () => resetViewState(),
        },
      });
    });
    const inst = new Session({ serverAddr, client });
    inst.retrieveRulesetList();
    await inst.postConnectInitialize();

    return inst;
  }

  public gameModeInfo(): Promise<GameModeInfo | null> {
    return this.client.getModeInfo()
  }

  public async retrieveRulesetList() {
    const rulesets = await this.client.listRulesets();
    store.dispatch(RootState.action.session(
      SessionState.action.setRulesetList(rulesets)
    ));
  }

  public async postConnectInitialize() {
    // Get the session, and check the current mode.
    const modeInfo = await this.gameModeInfo();

    dispatchApp.view(ViewState.action.setMode(ViewMode.CONNECTED));
    dispatchApp.view.connected(
      ConnectedViewState.action.setWsUrl(this.serverAddr)
    );

    // Update view.
    if (modeInfo == null) {
      dispatchApp.view.connected(
        ConnectedViewState.action.setViewMode(ConnectedViewMode.MAIN_MENU)
      );
      return;
    }

    if ("DefineRules" in modeInfo) {
      await this.defineRules.postConnectInit();
    } else if ("CreateWorld" in modeInfo) {
      await this.createWorld.postConnectInit();
    } else {
      console.error("Unknown game mode info", modeInfo);
    }
  }

  public cleanup(): void {
    console.log("Cleaning up Session");
    this.shutdown();
  }

  private constructor(args: {
    serverAddr: string,
    client: GameClient,
  }) {
    this.serverAddr = args.serverAddr;
    this.client = args.client;
    this.defineRules = new DefineRulesModule(this.client);
    this.createWorld = new CreateWorldModule(this.client);
  }

  private shutdown() {
    this.client.disconnect();
  }
}
