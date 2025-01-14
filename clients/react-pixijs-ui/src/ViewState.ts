import { useState } from "react";
import GameClient from "renfrew-river-protocol-client";
import GameServerSession from "./game/server_session";
import GameInstance from "./game/instance";
import DefRulesGameMode from "./game/mode/def_rules";

export default interface ViewState {
  client: GameClient | null;
  serverSession: GameServerSession | null;
  instance: GameInstance | DefRulesGameMode | null;
}

class StateField<T> {
  private value_: T;
  private setter_: (value: T) => void;

  public constructor(value: T, setter: (value: T) => void) {
    this.value_ = value;
    this.setter_ = setter;
  }

  public get value(): T {
    return this.value_;
  }

  public set value(value: T) {
    this.setter_(value);
    this.value_ = value;
  }

}
function useStateField<T>(initialValue: T): StateField<T> {
  const [value, setValue] = useState<T>(initialValue);
  return new StateField(value, setValue);
}

class ViewStateImpl implements ViewState {
  private readonly client_: StateField<GameClient | null>;
  private readonly serverSession_: StateField<GameServerSession | null>;
  private instance_: StateField<GameInstance | DefRulesGameMode | null>;

  public constructor(args: {
    client: StateField<GameClient | null>,
    serverSession: StateField<GameServerSession | null>,
    instance: StateField<GameInstance | DefRulesGameMode | null>,
  }) {
    this.client_ = args.client;
    this.serverSession_ = args.serverSession;
    this.instance_ = args.instance;
  }

  public get client(): GameClient | null {
    return this.client_.value;
  }
  public set client(client: GameClient | null) {
    this.client_.value = client;
  }

  public get serverSession(): GameServerSession | null {
    return this.serverSession_.value;
  }
  public set serverSession(serverSession: GameServerSession | null) {
    this.serverSession_.value = serverSession;
  }

  public get instance(): GameInstance | DefRulesGameMode | null {
    return this.instance_.value;
  }
  public set instance(instance: GameInstance | DefRulesGameMode | null) {
    this.instance_.value = instance;
  }
}

export function useViewState(): ViewState {
  const client = useStateField<GameClient | null>(null);
  const serverSession = useStateField<GameServerSession | null>(null);
  const instance = useStateField<GameInstance | DefRulesGameMode | null>(null);
  return new ViewStateImpl({ client, serverSession, instance });
}
