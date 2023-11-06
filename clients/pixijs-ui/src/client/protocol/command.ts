import { HasGameCmd } from "./commands/has_game_cmd";
import { GetConstantsCmd } from "./commands/get_constants_cmd";
import { DefaultSettingsCmd } from "./commands/default_settings_cmd";
import { NewGameCmd } from "./commands/new_game_cmd";
import { StopGameCmd } from "./commands/stop_game_cmd";
import { ReadMapDataCmd } from "./commands/read_map_data_cmd";
import { MiniElevationsCmd } from "./commands/mini_elevations_cmd";
import { ReadAnimalsCmd } from "./commands/read_animals_cmd";
import { TakeTurnStepCmd } from "./commands/take_turn_step_cmd";

/**
 * Protocol commands.
 */
export type ProtocolCommand = {
  HasGame: HasGameCmd,
  GetConstants: GetConstantsCmd,
  DefaultSettings: DefaultSettingsCmd,
  NewGame: NewGameCmd,
  StopGame: StopGameCmd,
  ReadMapData: ReadMapDataCmd,
  MiniElevations: MiniElevationsCmd,
  ReadAnimals: ReadAnimalsCmd,
  TakeTurnStep: TakeTurnStepCmd,
};

export type ProtocolCommandName = keyof ProtocolCommand;

export type ProtocolCommandParams<T extends ProtocolCommandName> =
  ProtocolCommand[T]["params"];

export type ProtocolCommandResponse<T extends ProtocolCommandName> =
  | _CoaleseResponse<T, keyof ProtocolCommand[T]["response"]>
  | { Error: { messages: string[] } };

export type _CoaleseResponse<
  T extends ProtocolCommandName,
  R extends keyof ProtocolCommand[T]["response"]
> = R extends string ? { [key in R]: ProtocolCommand[T]["response"][R] } : never;
