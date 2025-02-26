import ValidateRulesCmd, { ValidateRulesRsp }
  from "./validate_rules_cmd";

type DefineRulesSubcmd = {
  ValidateRules: {
    params: ValidateRulesCmd,
    response: {
      Validation: ValidateRulesRsp,
    },
  }
}

export default DefineRulesSubcmd;
