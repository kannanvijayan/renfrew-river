import GameClient, { GameModeInfo } from "renfrew-river-protocol-client";

import { store } from "../store/root";
import RootState from "../state/root";
import SessionState from "../state/session";
import ViewState, { ViewMode } from "../state/view";

import WsTransport from "./ws_transport";
import { DefineRulesModule } from "./define_rules";
import { CreateWorldModule } from "./create_world";
import { dispatchApp } from "../store/dispatch";
import ConnectedViewState, { ConnectedViewMode } from "../state/view/connected_view";

/**
 * The behavioural logic for maintaining a client connection (session)
 * to the server.
 */
export default class Session {
  private static instance: Session | null = null;
  private static instancePromise: Promise<Session> | null = null;

  public readonly serverAddr: string;
  public readonly client: GameClient;

  public readonly defineRules: DefineRulesModule;
  public readonly createWorld: CreateWorldModule;

  public static async connectToServer(serverAddr: string): Promise<Session> {
    const currentSession = Session.maybeGetInstance();
    if (currentSession) {
      if (currentSession.serverAddr === serverAddr) {
        return currentSession;
      }
      throw new Error("Session already initialized");
    }

    if (Session.instancePromise) {
      return Session.instancePromise;
    }

    const resetViewState = () => {
      Session.instance = null;
      Session.instancePromise = null;
      store.dispatch(RootState.action.view(
        ViewState.action.setMode(ViewMode.UNCONNECTED)
      ));
    };

    Session.instancePromise = null;
    Session.instancePromise = (async () => {
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
      const inst = await Session.createInstance({ serverAddr, client });
      await inst.postConnectInitialize();
      return inst;
    })();

    return Session.instancePromise;
  }

  public static shutdownInstance() {
    if (!Session.instance) {
      throw new Error("Session not initialized");
    }
    Session.instance.shutdown();
    Session.instance = null;
  }

  public static getInstance(): Session {
    if (!Session.instance) {
      throw new Error("Session not initialized");
    }
    return Session.instance;
  }

  public static maybeGetInstance(): Session | null {
    return Session.instance;
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

  private constructor(args: {
    serverAddr: string,
    client: GameClient,
  }) {
    this.serverAddr = args.serverAddr;
    this.client = args.client;
    this.defineRules = new DefineRulesModule(this.client);
    this.createWorld = new CreateWorldModule(this.client);
  }

  private static createInstance(args: {
    serverAddr: string,
    client: GameClient,
  }): Session {
    const { serverAddr, client } = args;
    if (Session.instance) {
      throw new Error("Session already initialized");
    }
    Session.instance = new Session({ serverAddr, client });
    Session.instance.retrieveRulesetList();
    return Session.instance;
  }

  private shutdown() {
    this.client.disconnect();
  }
}
