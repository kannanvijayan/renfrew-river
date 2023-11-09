import GameClient from "renfrew-river-protocol-client";
import { WsTransport } from "./ws_transport";
import { TestReporter } from "./suite";

export function newGameClient(
  url: string,
  reporter: TestReporter,
): Promise<GameClient> {
  return new Promise<GameClient>((res, rej) => {
    reporter.log(`Connecting to game client at: ${url}`);
    const client = new GameClient({
      transport: new WsTransport(url),
      callbacks: {
        onConnect: () => {
          reporter.log(`  * Connected!`);
          res(client);
        },
        onError: err => {
          reporter.error(`  * Error! ${err}`);
          rej(err);
        },
      }
    });
  });
}
