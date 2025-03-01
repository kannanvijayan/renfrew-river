import Ruleset, {
  RulesetInput,
  RulesetValidation,
} from "../types/ruleset/ruleset";
import DefineRulesSubcmd
  from "../protocol/commands/define_rules/define_rules_subcmd";
import GameClientModule from "./module";
import SubcmdSender from "./subcmd_sender";

export class GameClientDefineRulesModule
  extends GameClientModule<DefineRulesSubcmd>
{
  public constructor(sender: SubcmdSender) {
    super(sender, "DefineRules");
  }

  public async enter(): Promise<true> {
    return this.sender_.enterMode({ DefineRules: {}});
  }

  public async leave(): Promise<true> {
    return this.sender_.enterMainMenuMode();
  }

  public async updateRules(rulesetInput: RulesetInput)
    : Promise<true|RulesetValidation>
  {
    const result = await this.sendSubcmd("UpdateRules", { rulesetInput });
    if ("Ok" in result) {
      return true;
    } else {
      return result.InvalidRuleset;
    }
  }

  public async currentRules(): Promise<{
    ruleset: RulesetInput,
    validation?: RulesetValidation,
  }> {
    const result = await this.sendSubcmd("CurrentRules", {});
    if ("CurrentRules" in result) {
      return result.CurrentRules;
    }
    throw new Error("CurrentRules: unexpected response");
  }

  public async saveRules(): Promise<true> {
    const result = await this.sendSubcmd("SaveRules", {});
    console.log("SaveRules result:", result);
    if ("Ok" in result) {
      return true;
    }
    throw new Error(
      "SaveRules: unexpected response: " + result.Failed.join(", ")
    );
  }

  public async loadRules(rulesetName: string): Promise<Ruleset> {
    const result = await this.sendSubcmd("LoadRules", { rulesetName });
    if ("LoadedRuleset" in result) {
      return result.LoadedRuleset;
    }
    throw new Error(
      "LoadRules failed " + result.Failed.join(", ")
    );
  }
}
