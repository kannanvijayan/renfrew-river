import Ruleset, { RulesetValidation } from "../../../types/ruleset/ruleset";
import BeginNewWorldCmd from "./begin_new_world_cmd";

type CreateWorldSubcmd = {
  BeginNewWorld: {
    params: BeginNewWorldCmd,
    response: {
      Ok: {},
      Failed: string[],
    },
  },
}

export default CreateWorldSubcmd;
