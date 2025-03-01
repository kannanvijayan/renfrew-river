import GameClient, {
  RulesetInput,
  RulesetValidation,
} from "renfrew-river-protocol-client";

import { BumpTimeout } from "../util/bump_timeout";
import RootState from "../state/root";
import ViewState from "../state/view";
import ConnectedViewState, { ConnectedViewMode } from "../state/view/connected_view";
import DefineRulesViewState from "../state/view/define_rules/define_rules";
import { store } from "../store/root";
import { dispatchApp } from "../store/dispatch";

export class DefineRulesModule {
  private readonly client: GameClient;
  public readonly view: DefineRulesViewController;

  constructor(client: GameClient) {
    this.client = client;
    this.view = new DefineRulesViewController(this.client);
  }

  public async postConnectInit() {
    dispatchApp.view.connected(
      ConnectedViewState.action.setViewMode(ConnectedViewMode.DEFINE_RULES)
    );
    const currentRules = await this.client.defineRules.currentRules();
    dispatchApp.view.connected(ConnectedViewState.action.setDefineRules(
      DefineRulesViewState.fromRulesetInputAndValidation(
        currentRules.ruleset,
        currentRules.validation || null,
      )
    ));
    this.view.bumpValidationTimeout();
  }

  public async enter(): Promise<true> {
    await this.client.defineRules.enter();
    return true;
  }

  public async updateRules(rulesetInput: RulesetInput)
    : Promise<true | RulesetValidation>
  {
    return this.client.defineRules.updateRules(rulesetInput);
  }

  public async saveRules(): Promise<true> {
    return this.client.defineRules.saveRules();
  }

  public async loadRules(rulesetName: string): Promise<true> {
    await this.client.defineRules.loadRules(rulesetName);
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
    await this.client.defineRules.leave();
    return true;
  }
}

export class DefineRulesViewController {
  private static readonly DEFAULT_BUMP_INTERVAL = 50;
  private readonly client_: GameClient;
  private validationTimeout_: BumpTimeout | null;

  constructor(client: GameClient) {
    this.client_ = client;
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

  private async syncSendRulesetInput() {
    console.log("DefineRulesViewController.validateInput");
    const state = store.getState();
    const defRulesViewState = state.view.connected.defineRules;
    if (!defRulesViewState) {
      return;
    }
    const input = DefineRulesViewState.createRulesetInput(defRulesViewState);
    const result = await this.client_.defineRules.updateRules(input);
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
      await this.client_.defineRules.currentRules();
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
