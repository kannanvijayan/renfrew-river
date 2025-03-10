import { WorldDescriptor } from "renfrew-river-protocol-client";
import Graphics from "./graphics/graphics";
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
  private graphics: Graphics | null =  null;

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

  public async initGraphics(canvas: HTMLCanvasElement): Promise<Graphics> {
    if (this.graphics) {
      this.graphics.reset(canvas);
    }
    if (!this.graphics) {
      this.graphics = Graphics.create(canvas);
    }
    return this.graphics;
  }

  public async initSimulation(descriptor: WorldDescriptor): Promise<Simulation> {
    // Can just set to null to free old data.
    if (this.simulation) {
      this.simulation = null;
    }
    if (!this.session) {
      throw new Error("Session not initialized");
    }
    const session = this.session;
    this.simulation = new Simulation({ descriptor, session });
    return this.simulation;
  }

  public getSession(): Session {
    if (!this.session) {
      throw new Error("Session not initialized");
    }
    return this.session;
  }

  public getGraphics(): Graphics {
    if (!this.graphics) {
      throw new Error("Graphics not initialized");
    }
    return this.graphics;
  }

  private constructor() {
    if (Application.instance) {
      console.error("Application: Multiple instances detected.  Continuing.", {
        existingInstance: Application.instance
      });
    }
  }

  private cleanup(): void {
    if (this.graphics) {
      this.graphics.cleanup();
      this.graphics = null;
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
