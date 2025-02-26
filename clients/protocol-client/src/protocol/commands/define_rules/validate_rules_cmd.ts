import { RulesetInput, RulesetValidation } from "../../../types/ruleset/ruleset";

type ValidateRulesCmd = {
  rulesetInput: RulesetInput;
}

type ValidateRulesRsp = { isValid: boolean, validation?: RulesetValidation };

export default ValidateRulesCmd;
export type {
  ValidateRulesRsp,
};
