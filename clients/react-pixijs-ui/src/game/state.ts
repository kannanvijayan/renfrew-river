import { useState } from "react";
import GameClient from "renfrew-river-protocol-client";
import GameServerSession from "./server_session";

interface GameState {
  client: GameClient | null;
  serverSession: GameServerSession | null;
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

class GameStateImpl implements GameState {
  private readonly client_: StateField<GameClient|null>;
  private readonly serverSession_: StateField<GameServerSession|null>;

  public constructor(args: {
    client: StateField<GameClient|null>,
    serverSession: StateField<GameServerSession|null>,
  }) {
    this.client_ = args.client;
    this.serverSession_ = args.serverSession;
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
}

export function useGameState(): GameState {
  const client = useStateField<GameClient|null>(null);
  const serverSession = useStateField<GameServerSession|null>(null);
  return new GameStateImpl({ client, serverSession });
}
