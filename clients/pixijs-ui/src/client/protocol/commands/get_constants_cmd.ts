import { Constants } from "../types/constants";

export type GetConstantsCmd = {
  params: Record<string, never>;
  response: {
    Constants: Constants;
  }
};
