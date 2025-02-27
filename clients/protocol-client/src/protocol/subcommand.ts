
import DefineRulesSubcmd from "./commands/define_rules/define_rules_subcmd";

/**
 * Protocol commands.
 */
export type ProtocolSubcmdSpec = {
  [key: string]: {
    params: Record<string, unknown>,
    response: Record<string, unknown>,
    error?: Record<string, unknown>,
  }
};

export type ProtocolSubcmdName<S extends ProtocolSubcmdSpec> = keyof S;

export type ProtocolSubcmdParams<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>,
> = S[T]["params"];

export type ProtocolSubcmdResponse<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>
> =
  | _CoaleseResponse<S, T, keyof S[T]["response"]>
  | ProtocolSubcmdError<S, T>;

export type ProtocolSubcmdError<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>
> = _CoaleseError<S, T, _ExtractErrorNames<S, T> & string>;


export type _CoaleseResponse<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>,
  R extends keyof S[T]["response"]
> = R extends string ? { [key in R]: S[T]["response"][R] } : never;

export type _CoaleseError<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>,
  E extends string,
> = E extends string ?
      E extends _ExtractErrorNames<S, T> ?
        { [key in E]: _ExtractError<S, T, E> }
      : never
    : never;

export type _ExtractErrorNames<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>,
> =
  "error" extends keyof S[T] ? keyof S[T]["error"] : never;

export type _ExtractError<
  S extends ProtocolSubcmdSpec,
  T extends ProtocolSubcmdName<S>,
  E extends string,
> =
  "error" extends keyof S[T] ?
    (E extends keyof S[T]["error"] ?  S[T]["error"][E] : never)
  : never;
