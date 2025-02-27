import ValidateRulesCmd, { ValidateRulesRsp }
  from "./validate_rules_cmd";

import SaveRulesCmd from "./save_rules_cmd";

type DefineRulesSubcmd = {
  ValidateRules: {
    params: ValidateRulesCmd,
    response: {
      Validation: ValidateRulesRsp,
    },
  },
  SaveRules: {
    params: SaveRulesCmd,
    response: {
      Ok: {}
      Failed: string[],
    },
  },
}

export default DefineRulesSubcmd;
