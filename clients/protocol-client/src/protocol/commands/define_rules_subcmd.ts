import ValidateRulesCmd, { ValidateRulesRsp }
  from "./define_rules/validate_rules_cmd";

type DefineRulesSubcmd = {
  ValidateRules: {
    params: ValidateRulesCmd,
    response: {
      Validation: ValidateRulesRsp,
    },
  }
}

export default DefineRulesSubcmd;
