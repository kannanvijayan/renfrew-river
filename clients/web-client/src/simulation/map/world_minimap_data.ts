import { GenerationCellDatumId, WorldDims } from "renfrew-river-protocol-client";
import MapData, { ReadMiniMapDataCallback } from "./map_data";
import MinimapDataset from "./minimap_dataset";

/**
 * Holder of mini-map data.
 */
export default class WorldMinimapData {
  public readonly miniDims: WorldDims;
  private readonly dataset: MinimapDataset;

  static readonly DEFAULT_MINI_DIMS: WorldDims = { rows: 250, columns: 250 };

  public constructor(opts: {
    readMiniMapDataCallback: ReadMiniMapDataCallback,
    miniDims?: WorldDims,
  }) {
    const { readMiniMapDataCallback, miniDims: maybeMiniDims } = opts;
    const miniDims = maybeMiniDims ?? WorldMinimapData.DEFAULT_MINI_DIMS;
    this.miniDims = miniDims;
    this.dataset = new MinimapDataset({ miniDims, readMiniMapDataCallback });
  }

  public async forDatum(datumId: GenerationCellDatumId)
    : Promise<MapData<"uint32", 1>>
  {
    return this.dataset.getMinimapData(datumId);
  }

  public getObservedDatumIds(): GenerationCellDatumId[] {
    return this.dataset.getObservedDatumIds();
  }

  public setObservedDatumIds(datumIds: GenerationCellDatumId[]): void {
    this.dataset.setObservedDatumIds(datumIds);
  }

  public setVisualizedDatumId(datumIndex: number): void {
    this.dataset.setVisualizedDatumId(datumIndex);
  }

  public addRefreshListener(listener: () => void): () => void {
    return this.dataset.addRefreshListener(listener);
  }

  public invalidate(): void {
    this.dataset.invalidate();
  }

  public getTextureSource(): MapData<"float32", 1> {
    return this.dataset.getTextureSource();
  }
}
