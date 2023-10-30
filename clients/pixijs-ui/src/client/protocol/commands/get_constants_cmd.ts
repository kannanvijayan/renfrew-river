import { Constants } from "../types/constants";

export type GetConstantsCmd = {
  params: {};
  response: {
    Constants: Constants;
  }
};