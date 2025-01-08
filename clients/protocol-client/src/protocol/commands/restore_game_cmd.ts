import { EmptyObject } from "../../util/empty_object";

export type RestoreGameCmd = {
  params: {
    snapshot: string;
  };
  response: {
    Ok: EmptyObject;
  };
};
