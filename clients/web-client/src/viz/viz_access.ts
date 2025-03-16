
export default interface VizAccess {
  readonly width: number;
  readonly height: number;

  addResizeListener(
    listener: (width: number, height: number) => void
  ): () => void;
}
