import GameClient, { ruleset } from "renfrew-river-protocol-client";

export default class DefineRulesSender {
  private readonly gameClient_: GameClient;

  constructor(gameClient: GameClient) {
    this.gameClient_ = gameClient;
  }

  public async validateRules(rulesetInput: ruleset.RulesetInput)
    : Promise<true|ruleset.RulesetValidation>
  {
    return this.gameClient_.defineRules.validateRules(rulesetInput);
  }
}
