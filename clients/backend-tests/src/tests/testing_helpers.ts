import GameClient from "renfrew-river-protocol-client";
import { GameProcess } from "../game_process";
import { HarnessParams } from "../harness_params";
import { TestReporter } from "../suite";
import { newGameClient } from "../game_client";

/** Spawn a new game server and connect to it when its ready.
 *  Return the game process and the game client.
 */
export async function spawnGameAndConnect(
  harnessParams: HarnessParams,
  reporter: TestReporter,
): Promise<{
  gameProcess: GameProcess,
  gameClient: GameClient,
}> {
  const gameProcess = await new Promise<GameProcess>((res, rej) => {
    const gameProcess = new GameProcess({
      port: harnessParams.port,
      serverExecutable: harnessParams.serverExecutable,
      reporter,
    });
    gameProcess.on("error", err => rej(err));
    gameProcess.start();
    gameProcess.waitUntilReady().then(() => res(gameProcess));
  });

  const url = `ws://localhost:${harnessParams.port}`;
  const gameClient = await newGameClient(url, reporter);
  return { gameProcess, gameClient };
}
