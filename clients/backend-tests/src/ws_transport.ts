import EventEmitter from 'events';
import { GameClientTransport, GameClientTransportListeners } from 'renfrew-river-protocol-client/dist/game_client';
import WebSocket from 'ws';

export class WsTransport extends EventEmitter implements GameClientTransport {
  private ws: WebSocket;
  private callbacks: any;

  constructor(url: string) {
    super();
    this.ws = new WebSocket(url);
  }

  send(msg: string) {
    this.ws.send(msg);
  }

  close() {
    this.ws.close();
  }

  addEventListener<T extends keyof GameClientTransportListeners>(
    eventType: T,
    listener: GameClientTransportListeners[T]
  ): void {
    switch (eventType) {
      case "open":
        this.ws.addEventListener("open", listener as any);
        break;
      case "close":
        this.ws.addEventListener("close", listener as any);
        break;
      case "error":
        this.ws.addEventListener("error", listener as any);
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
}
