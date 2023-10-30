import { WorldDims } from "./types/world_dims";
import GameWorld from "./world";
import GameWorldElevations from "./world_elevations";

/**
 * A read-only interface to observe the world.
 */
export default class GameWorldObserver {
  private readonly world: GameWorld;

  constructor(opts: {
    world: GameWorld,
  }) {
    const { world } = opts;
    this.world = world;
  }

  public worldDims(): WorldDims {
    return { ...this.world.worldDims };
  }

  public elevationValues(): Readonly<Uint8Array> {
    return this.world.elevations.values;
  }

  public elevationAt(x: number, y: number): number {
    return this.world.elevations.valueAt(x, y);
  }

  public miniDims(): WorldDims {
    return { ...this.world.miniDims };
  }

  public miniElevations(): GameWorldElevations {
    return this.world.miniElevations;
  }
}