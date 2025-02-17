import GameClient from "renfrew-river-protocol-client";
import WsTransport from "./ws_transport";
import DefineRulesSender from "./define_rules_sender";
import { BumpTimeout } from "../util/bump_timeout";
import DefRulesViewState from "../state/view/def_rules";
import { store } from "../store/root";
import RootState from "../state/root";
import ViewState from "../state/view";
import ConnectedViewState from "../state/view/connected_view";

/**
 * The behavioural logic for maintaining a client connection (session)
 * to the server.
 */
export default class Session {
  private static instance: Session | null = null;
  private static instancePromise: Promise<Session> | null = null;

  public readonly serverAddr: string;
  public readonly client: GameClient;

  public readonly send: SessionSender;
  public readonly defRules: DefRulesModule;

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

    Session.instancePromise = (async () => {
      const ws = new WebSocket(serverAddr);
      const transport = new WsTransport(ws);
      const client = await new Promise<GameClient>((resolve, reject) => {
        console.log("Session.connectToServer 3", serverAddr);
        const client = new GameClient({
          transport,
          callbacks: {
            onConnect: () => resolve(client),
            onError: (err) => reject(new Error("Failed to connect to server: " + err)),
          }
        });
      });
      console.log("Session.connectToServer 4", serverAddr);
      Session.instancePromise = null;
      return Session.createInstance({ serverAddr, client });
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

  private constructor(args: {
    serverAddr: string,
    client: GameClient,
  }) {
    this.serverAddr = args.serverAddr;
    this.client = args.client;
    this.send = new SessionSender(args.client);
    this.defRules = new DefRulesModule(this);
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
    return Session.instance;
  }

  private shutdown() {
    this.client.disconnect();
  }
}

export class SessionSender {
  public readonly defineRules: DefineRulesSender;

  constructor(gameClient: GameClient) {
    this.defineRules = new DefineRulesSender(gameClient);
  }
}

export class DefRulesModule {
  public readonly session: Session;
  public readonly view: DefRulesViewController;

  constructor(session: Session) {
    this.session = session;
    this.view = new DefRulesViewController(this);
  }
}

export class DefRulesViewController {
  private readonly module_: DefRulesModule;
  private validationBumpTimout_: BumpTimeout | null;

  constructor(module: DefRulesModule) {
    this.module_ = module;
    this.validationBumpTimout_ = null;
  }

  public bumpValidationTimeout() {
    let timeout = this.validationBumpTimout_;
    if (timeout) {
      timeout.bump();
    } else {
      timeout = new BumpTimeout(500, () => this.validateInput());
      this.validationBumpTimout_ = timeout;
    }
  }

  private get gameClient() {
    return this.module_.session.client;
  }

  private async validateInput() {
    console.log("DefRulesViewController.validateInput");
    const state = store.getState();
    const defRulesViewState = state.view.connected.defRules;
    if (!defRulesViewState) {
      return;
    }
    const input = DefRulesViewState.createRulesetInput(defRulesViewState);
    const result = await this.gameClient.defineRules.validateRules(input);
    const validation = result === true ? null : result;
    console.log("DefRulesViewController.validateInput", validation);
    store.dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.defRules(
          DefRulesViewState.action.setValidation(validation)
        )
      )
    ));
    this.validationBumpTimout_ = null;
  }
}
