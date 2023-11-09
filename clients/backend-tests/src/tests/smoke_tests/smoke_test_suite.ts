import { HarnessParams } from "../../harness_params";
import { SuiteResults } from "../../suite";
import { testStartStopServer } from "./test_start_stop_server";

export async function smokeTestSuite(params: HarnessParams)
  : Promise<SuiteResults>
{
  const suite = new SuiteResults({ name: "Smoke Tests" });

  await suite.runTest("testStartStopServer", async reporter => {
    await testStartStopServer(reporter, params);
  });
  return suite;
}
