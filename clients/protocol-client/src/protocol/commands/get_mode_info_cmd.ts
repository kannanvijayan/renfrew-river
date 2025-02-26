import GameModeInfo from "../../types/game_mode_info";

type GetModeInfoCmd = {
  params: {},
  response: {
    InMainMenuMode: {},
    InMode: GameModeInfo,
  }
};

export default GetModeInfoCmd;
