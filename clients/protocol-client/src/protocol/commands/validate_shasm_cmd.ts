import { ShasmParseError } from "../../types/shady_vm";
import { EmptyObject } from "../../util/empty_object";

export type ValidateShasmCmd = {
  params: {
    programText: string,
  };
  response: {
    Ok: EmptyObject;
  };
  error: {
    InvalidShasm: {
      errors: ShasmParseError[],
    }
  }
};
