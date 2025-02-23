import { GameModeInfo } from "../../types/game_mode_info";

type EnterModeCmd = {
  params: {
    mode: GameModeInfo,
  },
  response: {
    Ok: {},
    Error: string[],
  }
};

export default EnterModeCmd;
