import GameClient, {
  RulesetInput,
  RulesetValidation,
} from "renfrew-river-protocol-client";

export default class DefineRulesSender {
  private readonly gameClient_: GameClient;

  constructor(gameClient: GameClient) {
    this.gameClient_ = gameClient;
  }

  public async enter(): Promise<true> {
    return this.gameClient_.defineRules.enter();
  }

  public async leave(): Promise<true> {
    return this.gameClient_.defineRules.leave();
  }

  public async validateRules(rulesetInput: RulesetInput)
    : Promise<true | RulesetValidation>
  {
    return this.gameClient_.defineRules.validateRules(rulesetInput);
  }

  public async saveRules(): Promise<true> {
    return this.gameClient_.defineRules.saveRules();
  }
}
