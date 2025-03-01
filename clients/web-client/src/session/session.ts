import GameClient from "renfrew-river-protocol-client";
import WsTransport from "./ws_transport";
import DefineRulesSender from "./define_rules_sender";
import { BumpTimeout } from "../util/bump_timeout";
import DefineRulesViewState from "../state/view/define_rules";
import { store } from "../store/root";
import RootState from "../state/root";
import ViewState, { ViewMode } from "../state/view";
import ConnectedViewState from "../state/view/connected_view";
import { GameModeInfo } from "renfrew-river-protocol-client";
import SessionState from "../state/session";

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
  public readonly defineRules: DefineRulesModule;

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

  public gameModeInfo(): Promise<GameModeInfo | null> {
    return this.client.getModeInfo()
  }

  public async retrieveRulesetList() {
    const rulesets = await this.client.listRulesets();
    store.dispatch(RootState.action.session(
      SessionState.action.setRulesetList(rulesets)
    ));
  }

  private constructor(args: {
    serverAddr: string,
    client: GameClient,
  }) {
    this.serverAddr = args.serverAddr;
    this.client = args.client;
    this.send = new SessionSender(args.client);
    this.defineRules = new DefineRulesModule(this);
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

export class SessionSender {
  public readonly defineRules: DefineRulesSender;

  constructor(gameClient: GameClient) {
    this.defineRules = new DefineRulesSender(gameClient);
  }
}

export class DefineRulesModule {
  public readonly session: Session;
  public readonly view: DefineRulesViewController;

  constructor(session: Session) {
    this.session = session;
    this.view = new DefineRulesViewController(this);
  }

  public async enter(): Promise<true> {
    await this.session.client.defineRules.enter();
    return true;
  }

  public async loadRules(rulesetName: string): Promise<true> {
    await this.session.client.defineRules.loadRules(rulesetName);
    store.dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.defineRules(
          DefineRulesViewState.action.setValidation(null)
        )
      )
    ));
    store.dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.defineRules(
          DefineRulesViewState.action.setUpdateExisting(rulesetName)
        )
      )
    ));
    return true;
  }

  public async leave(): Promise<true> {
    await this.session.client.defineRules.leave();
    return true;
  }
}

export class DefineRulesViewController {
  private static readonly DEFAULT_BUMP_INTERVAL = 50;
  private readonly module_: DefineRulesModule;
  private validationTimeout_: BumpTimeout | null;

  constructor(module: DefineRulesModule) {
    this.module_ = module;
    this.validationTimeout_ = null;
  }


  public bumpValidationTimeout(interval?: number) {
    let timeout = this.validationTimeout_;
    interval = interval ?? DefineRulesViewController.DEFAULT_BUMP_INTERVAL;
    if (timeout) {
      timeout.bump(interval);
    } else {
      timeout = new BumpTimeout(interval, () => this.syncSendRulesetInput());
      this.validationTimeout_ = timeout;
    }
  }

  private get gameClient() {
    return this.module_.session.client;
  }

  private async syncSendRulesetInput() {
    console.log("DefineRulesViewController.validateInput");
    const state = store.getState();
    const defRulesViewState = state.view.connected.defineRules;
    if (!defRulesViewState) {
      return;
    }
    const input = DefineRulesViewState.createRulesetInput(defRulesViewState);
    const result = await this.gameClient.defineRules.updateRules(input);
    const validation = result === true ? null : result;
    console.log("DefineRulesViewController.validateInput", validation);
    store.dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.defineRules(
          DefineRulesViewState.action.setValidation(validation)
        )
      )
    ));
    this.validationTimeout_ = null;
  }

  public async syncRecvRulesetInput() {
    const { ruleset, validation } =
      await this.gameClient.defineRules.currentRules();
    store.dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.defineRules(
          DefineRulesViewState.action.setRuleset(ruleset)
        )
      )
    ));
    store.dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.defineRules(
          DefineRulesViewState.action.setValidation(validation || null)
        )
      )
    ));
  }
}
