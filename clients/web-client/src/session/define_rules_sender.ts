import GameClient, {
  RulesetInput,
  RulesetValidation,
} from "renfrew-river-protocol-client";

export default class DefineRulesSender {
  private readonly gameClient_: GameClient;

  constructor(gameClient: GameClient) {
    this.gameClient_ = gameClient;
  }

  public async updateRules(rulesetInput: RulesetInput)
    : Promise<true | RulesetValidation>
  {
    return this.gameClient_.defineRules.updateRules(rulesetInput);
  }

  public async saveRules(): Promise<true> {
    return this.gameClient_.defineRules.saveRules();
  }
}
