import { HasGameCmd } from "./commands/has_game_cmd";
import { GetConstantsCmd } from "./commands/get_constants_cmd";
import { DefaultSettingsCmd } from "./commands/default_settings_cmd";
import { NewGameCmd } from "./commands/new_game_cmd";
import { StopGameCmd } from "./commands/stop_game_cmd";
import { ReadMapDataCmd } from "./commands/read_map_data_cmd";
import { MiniElevationsCmd } from "./commands/mini_elevations_cmd";
import { ReadAnimalsCmd } from "./commands/read_animals_cmd";
import { TakeTurnStepCmd } from "./commands/take_turn_step_cmd";
import { GetCellInfoCmd } from "./commands/get_cell_info_cmd";
import { GetAnimalDataCmd } from "./commands/get_animal_data_cmd";
import { SnapshotGameCmd } from "./commands/snapshot_game_cmd";
import { ValidateShasmCmd } from "./commands/validate_shasm_cmd";
import { RestoreGameCmd } from "./commands/restore_game_cmd";
import { DefineRulesetCmd } from "./commands/define_ruleset_cmd";

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
  GetCellInfo: GetCellInfoCmd,
  GetAnimalData: GetAnimalDataCmd,
  SnapshotGame: SnapshotGameCmd,
  ValidateShasm: ValidateShasmCmd,
  RestoreGame: RestoreGameCmd,
  DefineRuleset: DefineRulesetCmd,
};

export type ProtocolCommandName = keyof ProtocolCommand;

export type ProtocolCommandParams<T extends ProtocolCommandName> =
  ProtocolCommand[T]["params"];

export type ProtocolCommandResponse<T extends ProtocolCommandName> =
  | _CoaleseResponse<T, keyof ProtocolCommand[T]["response"]>
  | ProtocolCommandError<T>
  | { Error: { messages: string[] } };

export type ProtocolCommandError<T extends ProtocolCommandName> =
  | _CoaleseError<T, _ExtractErrorNames<T> & string>;


export type _CoaleseResponse<
  T extends ProtocolCommandName,
  R extends keyof ProtocolCommand[T]["response"]
> = R extends string ? { [key in R]: ProtocolCommand[T]["response"][R] } : never;


export type _CoaleseError<
  T extends ProtocolCommandName,
  E extends string,
> = E extends string ?
      E extends _ExtractErrorNames<T> ?
        { [key in E]: _ExtractError<T, E> }
      : never
    : never;

export type _ExtractErrorNames<T extends ProtocolCommandName> =
  "error" extends keyof ProtocolCommand[T] ?
    keyof ProtocolCommand[T]["error"]
  : never;

export type _ExtractError<
  T extends ProtocolCommandName,
  E extends string,
> =
  "error" extends keyof ProtocolCommand[T] ?
    E extends keyof ProtocolCommand[T]["error"] ?
      ProtocolCommand[T]["error"][E]
    : never
  : never;
