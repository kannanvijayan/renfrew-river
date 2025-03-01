
/** The transport used by the game client to talk to the game server. */
export default interface GameClientTransport {
  addEventListener(type: "open", listener: () => void): void;
  addEventListener(type: "close", listener: () => void): void;
  addEventListener(type: "error", listener: (error?: unknown) => void): void;
  addEventListener(type: "message", listener: (message: string) => void): void;

  close(): void;
  send(data: string): void;
}
