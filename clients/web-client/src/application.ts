import { WorldDescriptor } from "renfrew-river-protocol-client";
import Viz from "./viz/viz";
import Session from "./session/session";
import Simulation from "./simulation/simulation";
import { dispatchApp } from "./store/dispatch";
import ConnectedViewState from "./state/view/connected_view";

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

  public async initSimulation(descriptor: WorldDescriptor)
    : Promise<Simulation>
  {
    if (!this.session) {
      throw new Error("Session must be initialized before simulation");
    }

    // Can just set to null to free old data.
    if (this.simulation) {
      console.error("Application: Multiple simulations detected.  Removing old one.");
      this.simulation = null;
    }
    const session = this.session;
    this.simulation = new Simulation({ descriptor, session });
    return this.simulation;
  }

  public async beginWorldCreation(descriptor: WorldDescriptor)
    : Promise<true>
  {
    console.log("beginWorldCreation", { descriptor });
    const session = this.getSession();
    await session.createWorld.beginWorldGeneration();
    await session.createWorld.takeGenerationStep("RandGen");
    await this.initSimulation(descriptor);

    dispatchApp.view.connected(ConnectedViewState.action.setCreateWorld({
      GeneratingWorld: {
        descriptor,
        phase: "PreInitialize",
      }
    }));

    return true;
  }

  public async initWorldCreationViz(canvas: HTMLCanvasElement): Promise<Viz> {
    console.log("initWorldCreationViz");
    const simulation = this.getSimulation();
    const reused = this.initViz(canvas);
    if (reused === "new") {
      simulation.setObservedDatumIds([ { RandGen: {} } ]);
      simulation.setVisualizedDatumId(0, 0);
      this.getViz().setVisualizedDatumIds({ colorTileWith: 0 });
      simulation.invalidateMapData();
    }
    return this.getViz();
  }

  private initViz(canvas: HTMLCanvasElement): "new"|"reused" {
    if (!this.session) {
      throw new Error("Session must be initialized before viz");
    }
    if (!this.simulation) {
      throw new Error("Simulation must be initialized before viz");
    }

    let reused: "new"|"reused" = "new";
    if (this.viz) {
      console.log("initWorldCreationViz - reusing existing viz");
      this.viz.reuse(canvas);
      reused = "reused";
    }
    if (!this.viz) {
      console.log("initWorldCreationViz - creating new viz");
      this.viz = Viz.create(canvas, this.simulation);
    }
    return reused;
  }

  public getSession(): Session {
    if (!this.session) {
      throw new Error("Session not initialized");
    }
    return this.session;
  }

  public getSimulation(): Simulation {
    if (!this.simulation) {
      throw new Error("Simulation not initialized");
    }
    return this.simulation;
  }

  public getViz(): Viz {
    if (!this.viz) {
      throw new Error("Viz not initialized");
    }
    return this.viz;
  }

  public static getInstance(): Application {
    if (Application.instance === null) {
      Application.instance = new Application();
      (window as unknown as Record<string, unknown>).RENFREW = Application.instance;
    }
    return Application.instance;
  }

  private constructor() {
    if (Application.instance) {
      console.error("Application: Multiple instances detected.  Continuing.", {
        existingInstance: Application.instance
      });
    }
  }
}
