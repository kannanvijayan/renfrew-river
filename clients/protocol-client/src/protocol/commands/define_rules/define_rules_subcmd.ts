import UpdateRulesCmd from "./update_rules_cmd";
import SaveRulesCmd from "./save_rules_cmd";
import LoadRulesCmd from "./load_rules_cmd";
import CurrentRulesCmd, { CurrentRulesRsp } from "./current_rules_cmd";
import Ruleset, { RulesetValidation } from "../../../types/ruleset/ruleset";

type DefineRulesSubcmd = {
  UpdateRules: {
    params: UpdateRulesCmd,
    response: {
      Ok: {},
      InvalidRuleset: RulesetValidation
    },
  },
  CurrentRules: {
    params: CurrentRulesCmd,
    response: {
      CurrentRules: CurrentRulesRsp,
    },
  },
  SaveRules: {
    params: SaveRulesCmd,
    response: {
      Ok: {},
      Failed: string[],
    },
  },
  LoadRules: {
    params: LoadRulesCmd,
    response: {
      LoadedRuleset: Ruleset,
      Failed: string[],
    },
  },
}

export default DefineRulesSubcmd;
