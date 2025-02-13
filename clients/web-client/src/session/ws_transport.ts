import { GameClientTransportListeners } from "renfrew-river-protocol-client";

export default class WsTransport {
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  addEventListener<T extends keyof GameClientTransportListeners>(
    eventType: T,
    listener: GameClientTransportListeners[T]
  ): void {
    switch (eventType) {
      case "open":
        this.ws.addEventListener(
          "open",
          listener as GameClientTransportListeners["open"]
        );
        break;
      case "close":
        this.ws.addEventListener(
          "close",
          listener as GameClientTransportListeners["close"]
        );
        break;
      case "error":
        this.ws.addEventListener(
          "error",
          listener as GameClientTransportListeners["error"]
        );
        break;
      case "message":
        this.ws.addEventListener("message", (event) => {
          if (typeof event.data !== "string") {
            throw new Error("Expected string data");
          }
          listener(event.data);
        });
        break;
      default:
        throw new Error(`Unknown event type ${eventType}`);
    }
  }

  close(): void {
    this.ws.close();
  }

  send(data: string): void {
    this.ws.send(data);
  }
}
