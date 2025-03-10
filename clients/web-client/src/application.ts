import { WorldDescriptor } from "renfrew-river-protocol-client";
import Viz from "./viz/viz";
import Session from "./session/session";
import Simulation from "./simulation/simulation";

export default class Application {
  private static instance: Application | null = null;

  // Represents the current session with the server.
  // Networking & server-related state is managed here.
  private session: Session | null = null;

  // Represents the current simulation.
  // CPU-memory simulation state is managed here.
  private simulation: Simulation | null = null;

  // Represents the current game rendering context.
  // GPU-memory rendering state is managed here.
  private viz: Viz | null =  null;

  public async initSession(serverAddr: string): Promise<Session> {
    if (this.session && this.session.serverAddr !== serverAddr) {
      this.session.cleanup();
      this.session = null;
    }
    if (!this.session) {
      this.session = await Session.connectToServer(serverAddr);
    }
    return this.session;
  }

  public async initSimulation(descriptor: WorldDescriptor): Promise<Simulation> {
    if (!this.session) {
      throw new Error("Session must be initialized before simulation");
    }

    // Can just set to null to free old data.
    if (this.simulation) {
      this.simulation = null;
    }
    const session = this.session;
    this.simulation = new Simulation({ descriptor, session });
    return this.simulation;
  }

  public async initViz(canvas: HTMLCanvasElement): Promise<Viz> {
    if (!this.session) {
      throw new Error("Session must be initialized before viz");
    }
    if (!this.simulation) {
      throw new Error("Simulation must be initialized before viz");
    }

    if (this.viz) {
      this.viz.reset(canvas);
    }
    if (!this.viz) {
      this.viz = Viz.create(canvas, this.simulation);
    }
    return this.viz;
  }

  public getSession(): Session {
    if (!this.session) {
      throw new Error("Session not initialized");
    }
    return this.session;
  }

  public getViz(): Viz {
    if (!this.viz) {
      throw new Error("Viz not initialized");
    }
    return this.viz;
  }

  private constructor() {
    if (Application.instance) {
      console.error("Application: Multiple instances detected.  Continuing.", {
        existingInstance: Application.instance
      });
    }
  }

  private cleanup(): void {
    if (this.viz) {
      this.viz.cleanup();
      this.viz = null;
    }
    if (this.session) {
      this.session.cleanup();
      this.session = null;
    }
  }

  public static getInstance(): Application {
    if (Application.instance === null) {
      Application.instance = new Application();
    }
    return Application.instance;
  }
  public static newInstance(): Application {
    if (Application.instance === null) {
      Application.instance = new Application();
    } else {
      console.error("Application: Multiple instances detected.  Continuing.", {
        existingInstance: Application.instance
      });
      Application.instance.cleanup();
    }
    return Application.instance;
  }
  public static cleanupInstance(): void {
    if (Application.instance) {
      Application.instance.cleanup();
      Application.instance = null;
    }
  }
}
