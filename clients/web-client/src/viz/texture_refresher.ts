import * as PIXI from "pixi.js";
import Deferred from "../util/deferred";

/**
 * A class that allows for repeated calls to `texture.update()`
 * without having them overlap.
 */
export default class TextureRefresher {
  private texture: PIXI.Texture;
  private updateInProgress: Deferred<void> | undefined;
  private updateScheduled: Deferred<void> | undefined;

  public constructor(texture: PIXI.Texture) {
    texture.baseTexture.addListener(
      "update",
      this.afterTextureUpdate.bind(this)
    );
    this.texture = texture;
    this.updateInProgress = undefined;
    this.updateScheduled = undefined;
  }

  public async update(): Promise<void> {
    // If an update is scheduled, then it will pick up the changes.
    if (this.updateScheduled) {
      return this.updateScheduled.getPromise();
    }

    const deferred = new Deferred<void>();

    // If an update is in progress, schedule one for later.
    if (this.updateInProgress) {
      this.updateScheduled = deferred;
      return deferred.getPromise();
    }

    // Otherwise, we can just update the texture now.
    this.updateInProgress = deferred;
    this.texture.update();
    return deferred.getPromise();
  }

  private afterTextureUpdate() {
    // Clear the in-progress update.
    if (!this.updateInProgress) {
      console.error("afterTextureUpdate(): texture update not in progress");
    }
    this.updateInProgress?.resolvePromise();
    this.updateInProgress = undefined;

    // If we have a scheduled update, perform it now.
    if (this.updateScheduled) {
      this.updateInProgress = this.updateScheduled;
      this.updateScheduled = undefined;
      this.texture.update();
    }
  }
}
