import { ChildProcess, spawn } from "child_process";
import EventEmitter from "events";
import { TestReporter } from "./suite";

export interface GameProcessEventEmitter {
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "ready", listener: () => void): this;
  on(event: "exited", listener: () => void): this;
}

/** Helper class to stand up and shut down the game server backend. */
export class GameProcess
  extends EventEmitter
  implements GameProcessEventEmitter
{
  /** The port the backend is running on. */
  private port: number;

  /** The path to the backend executable. */
  private serverExecutable: string;

  /** The test reporter. */
  private reporter: TestReporter;

  /** The server child process. */
  private serverProcess: ChildProcess | null;

  /** The saved stdout. */
  private serverStdout: string[];
  private serverStderr: string[];

  /** Whether we've seen the "listening on" message or not. */
  private ready: boolean;

  /** Whether we killed this process. */
  private killed: boolean;

  /** Whether the process stopped. */
  private exited: boolean;

  /** Whether the process errored. */
  private errored: boolean;

  constructor(args: {
    port: number,
    serverExecutable: string,
    reporter: TestReporter,
  }) {
    super();
    this.port = args.port;
    this.serverExecutable = args.serverExecutable;
    this.reporter = args.reporter;
    this.serverProcess = null;
    this.serverStdout = [];
    this.serverStderr = [];
    this.ready = false;
    this.killed = false;
    this.exited = false;
    this.errored = false;
  }

  /** Starts the server. */
  public start(): void {
    const serverProcess = spawn(
      this.serverExecutable,
      ['--serve-addr', `127.0.0.1:${this.port}`],
      {
        env: { "RUST_LOG": "info" },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    serverProcess.on("error", this.handleError.bind(this));
    serverProcess.on("exit", this.handleExit.bind(this));
    serverProcess.on("spawn", () => {
      serverProcess.stdout.on("data", this.handleStdoutData.bind(this));
      serverProcess.stderr.on("data", this.handleStderrData.bind(this));
    });
    this.serverProcess = serverProcess;
  }

  /** Stops the server. */
  public stop(): void {
    if (this.serverProcess) {
      this.killed = true;
      this.serverProcess.kill();
      this.serverProcess = null;
    }
  }

  /** Wait until the server is ready. */
  public async waitUntilReady(): Promise<void> {
    if (this.errored) {
      throw new Error("Process errored");
    }
    if (this.ready) {
      return;
    }
    return new Promise((resolve, reject) => {
      this.once("ready", resolve);
      this.once("error", reject);
    });
  }

  /** Wait until process has exited. */
  public async waitUntilExited(): Promise<void> {
    if (this.errored) {
      throw new Error("Process errored");
    }
    if (this.exited) {
      return;
    }
    return new Promise((resolve, reject) => {
      this.once("exited", resolve);
      this.once("error", reject);
    });
  }

  /** Check the stdout to see if the server is listening yet. */
  private checkReadyStatus(): boolean {
    const ready = (
      this.serverStdout.some(line => line.match(/listening on/i)) ||
      this.serverStderr.some(line => line.match(/listening on/i))
    );
    return ready;
  }

  private handleStdoutData(data: string): void {
    this.serverStdout.push(data.toString());
    if (!this.ready && this.checkReadyStatus()) {
      this.ready = true;
      this.emit("ready");
    }
  }

  private handleStderrData(data: string): void {
    this.serverStderr.push(data.toString());
    if (!this.ready && this.checkReadyStatus()) {
      this.ready = true;
      this.emit("ready");
    }
  }

  private handleError(err: Error): void {
    console.error("Server error:", err);
    this.errored = true;
    this.emit("error", err);
  }

  private handleExit(code: number | null, signal: string | null): void {
    this.exited = true;
    if (signal == "SIGTERM" && this.killed) {
      this.emit("exited");
      return;
    }
    this.errored = true;
    this.emit(
      "error",
      new Error(`Server exited with code ${code} and signal ${signal}`)
    );
  }
}
