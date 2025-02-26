import EnterModeCmd from "./commands/enter_mode_cmd";
import EnterMainMenuModeCmd from "./commands/enter_main_menu_mode_cmd";
import GetModeInfoCmd from "./commands/get_mode_info_cmd";

/**
 * Protocol commands.
 */
export type ProtocolCommand = {
  EnterMode: EnterModeCmd,
  EnterMainMenuMode: EnterMainMenuModeCmd,
  GetModeInfo: GetModeInfoCmd,
};

export type ProtocolCommandName = keyof ProtocolCommand;

export type ProtocolCommandParams<T extends ProtocolCommandName> =
  ProtocolCommand[T]["params"];

export type ProtocolCommandResponse<T extends ProtocolCommandName> =
  | _CoaleseResponse<T, keyof ProtocolCommand[T]["response"]>
  | ProtocolCommandError<T>

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
