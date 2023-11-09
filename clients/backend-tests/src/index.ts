import { parseArgs } from "util";
import { HarnessParams } from "./harness_params";
import { smokeTestSuite } from "./tests/smoke_tests/smoke_test_suite";

main();

// Catch and print unhandled exceptions.
process.on("uncaughtException", err => {
  console.error("Uncaught Exception", err);
});

async function main() {
  const harnessParams = parseHarnessParams();
  console.info("Harness parameters", harnessParams);

  (await smokeTestSuite(harnessParams)).printReport();
}

function parseHarnessParams(): HarnessParams {
  const args = parseArgs({
    options: {
      "server-executable": {
        type: "string",
        required: true,
        short: "s",
      },
      "port": {
        type: "string",
        required: false,
        short: "p",
      },
    }
  });

  const serverExecutable = args.values["server-executable"];
  if (!serverExecutable) {
    throw new Error("server-executable is required");
  }

  let port = 0;
  const portString = args.values["port"];
  if (!portString) {
    port = 1300 + Math.floor(Math.random() * 100);
  } else if (!portString.match(/[^0-9]+$/)) {
    throw new Error("port must be a number");
  } else {
    port = parseInt(portString, 10);
  }

  return { serverExecutable, port };
}
