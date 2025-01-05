import { WorldDims } from "renfrew-river-protocol-client";
import GameWorld from "./world";
import WorldMapTiledData from "./world_map_tiled_data";
import WorldMinimapData from "./world_minimap_data";

/**
 * A read-only interface to observe the world.
 */
export default class WorldObserver {
  private readonly world: GameWorld;

  constructor(world: GameWorld) {
    this.world = world;
  }

  public worldDims(): WorldDims {
    return { ...this.world.worldDims };
  }

  public miniDims(): WorldDims {
    return { ...this.world.miniDims };
  }

  public mapData(): WorldMapTiledData {
    return this.world.mapData;
  }

  public minimapData(): WorldMinimapData {
    return this.world.minimapData;
  }

  public addMapInvalidationListener(listener: () => void): () => void {
    this.world.mapData.addInvalidationListener(listener);
    return () => {
      this.world.mapData.removeInvalidationListener(listener);
    };
  }
}
