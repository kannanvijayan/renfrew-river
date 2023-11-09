import { HarnessParams } from "../../harness_params";
import { TestReporter } from "../../suite";
import { spawnGameAndConnect } from "../testing_helpers";

export async function testStartStopServer(
  testReporter: TestReporter,
  harnessParams: HarnessParams,
) {
  testReporter.setName("Start/Stop Server");
  const { gameProcess, gameClient } = await spawnGameAndConnect(
    harnessParams,
    testReporter,
  );

  gameClient.disconnect();
  gameProcess.stop();
  await gameProcess.waitUntilExited();
}
