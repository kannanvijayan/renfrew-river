import GameClient from "renfrew-river-protocol-client";
import WsTransport from "./ws_transport";

/**
 * The behavioural logic for maintaining a client connection (session)
 * to the server.
 */
export default class Session {
  private static instance: Session | null = null;

  public readonly client: GameClient;

  public static async connectToServer(serverAddr: string): Promise<Session> {
    if (Session.maybeGetInstance()) {
      throw new Error("Already connected to server");
    }

    const ws = new WebSocket(serverAddr);
    const transport = new WsTransport(ws);
    const client = await new Promise<GameClient>((resolve, reject) => {
      const client = new GameClient({
        transport,
        callbacks: {
          onConnect: () => resolve(client),
          onError: (err) => reject(new Error("Failed to connect to server: " + err)),
        }
      });
    });
    return Session.createInstance(client);
  }

  private static createInstance(client: GameClient): Session {
    if (Session.instance) {
      throw new Error("Session already initialized");
    }
    Session.instance = new Session({ client });
    return Session.instance;
  }

  public static shutdownInstance() {
    if (!Session.instance) {
      throw new Error("Session not initialized");
    }
    Session.instance.shutdown();
    Session.instance = null;
  }

  public static getInstance(): Session {
    if (!Session.instance) {
      throw new Error("Session not initialized");
    }
    return Session.instance;
  }

  public static maybeGetInstance(): Session | null {
    return Session.instance;
  }

  private constructor(args: {
    client: GameClient,
  }) {
    this.client = args.client;
  }

  private shutdown() {
    // Nothing to do.
    this.client.disconnect();
  }
}
