import GameClient, { GameClientTransportListeners }
  from "renfrew-river-protocol-client"
import GameServerSession from "./server_session";

export type GameLoaderEventListeners = {
  disconnect?: () => void,
};

/**
 * Top-level manager of game.
 */
export default class GameLoader {
  private static instance_: GameLoader | null = null;

  private client_: GameClient | null = null;
  private session_: GameServerSession | null = null;
  private readonly eventListeners_: GameLoaderEventListeners = {};

  private constructor() {
  }

  public static getInstance(): GameLoader {
    if (GameLoader.instance_ === null) {
      GameLoader.instance_ = new GameLoader();
    }
    return GameLoader.instance_;
  }

  public setOnDisconnect(listener: () => void): void {
    this.setListener("disconnect", listener);
  }

  public async connectToServer(serverAddr: string): Promise<GameServerSession> {
    if (this.client_) {
      throw new Error("Game.connectToServer: Already connected to server");
    }
    const ws = new WebSocket(serverAddr);
    const transport = {
      addEventListener<T extends keyof GameClientTransportListeners>(
        eventType: T,
        listener: GameClientTransportListeners[T]
      ): void {
        switch (eventType) {
          case "open":
            ws.addEventListener("open", listener as GameClientTransportListeners["open"]);
            break;
          case "close":
            ws.addEventListener("close", listener as GameClientTransportListeners["close"]);
            break;
          case "error":
            ws.addEventListener("error", listener as GameClientTransportListeners["error"]);
            break;
          case "message":
            ws.addEventListener("message", (event) => {
              if (typeof event.data !== "string") {
                throw new Error("Expected string data");
              }
              listener(event.data);
            });
            break;
          default:
            throw new Error(`Unknown event type ${eventType}`);
        }
      },
      close(): void {
        ws.close();
      },
      send(data: string): void {
        ws.send(data);
      }
    };
    // Connect to the server.
    const client = await new Promise<GameClient>((resolve, reject) => {
      const client = new GameClient({
        transport,
        callbacks: {
          onConnect: () => {
            console.log("Connected to server", serverAddr);
            resolve(client);
          },
          onError: () => {
            console.log("Failed to connect to server", serverAddr);
            reject();
          },
          onClose: () => {
            console.log("Remote server disconnected", serverAddr);
            this.handleRemoteDisconnect();
          },
        },
      });
    });
    this.client_ = client;

    // Get the game constants and settings limits.
    const constants = await client.getConstants();
    const settingsLimits = await client.defaultSettings();
    console.log(
      "Got constants and settings limits",
      { constants, settingsLimits }
    );

    // Create the server session.
    this.session_ = new GameServerSession(
      { serverAddr, client, constants, settingsLimits }
    );
    return this.session_;
  }

  public async disconnectFromServer(): Promise<void> {
    if (!this.client_) {
      console.warn("Game.disconnectFromServer: Not connected to server");
      return;
    }
    this.client_.disconnect();
    this.client_ = null;
    this.invokeListener("disconnect");
  }

  private handleRemoteDisconnect(): void {
    if (this.client_) {
      this.client_ = null;
    }
    if (this.session_) {
      this.session_ = null;
    }
    this.invokeListener("disconnect");
  }

  private setListener<T extends keyof GameLoaderEventListeners>(
    eventType: T,
    listener: GameLoaderEventListeners[T]
  ): void {
    this.eventListeners_[eventType] = listener;
  }

  private invokeListener<T extends keyof GameLoaderEventListeners>(
    eventType: T
  ): void {
    this.eventListeners_[eventType]?.();
  }
}
