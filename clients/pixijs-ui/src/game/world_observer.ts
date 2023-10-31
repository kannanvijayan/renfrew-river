import WorldMinimapData from "./world_minimap_data";
import { WorldDims } from "./types/world_dims";
import GameWorld from "./world";

/**
 * A read-only interface to observe the world.
 */
export default class WorldObserver {
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

  public miniDims(): WorldDims {
    return { ...this.world.miniDims };
  }

  public elevationValues(): Readonly<Uint8Array> {
    return this.world.mapData.elevations.array();
  }

  public minimapData(): WorldMinimapData {
    return this.world.minimapData;
  }
}