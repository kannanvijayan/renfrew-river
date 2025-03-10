import { CellComponentSelector } from "./cell";

type GenerationStepKind =
  | "RandGen"
  | "InitializeCell"
  | "PairwiseStep"
  | "PairwiseMerge"
  | "Finalize";

type GenerationPhase =
  | "NewlyCreated"
  | "PreInitialize"
  | "CellInitialized"
  | "PreMerge"
  | "Finalized";

type GenerationCellDatumId =
  | { RandGen: {} }
  | { Selector: CellComponentSelector };

const GenerationCellDatumId = {
  toStringKey(id: GenerationCellDatumId): string {
    if ("RandGen" in id) {
      return "RandGen";
    } else {
      const { word, component } = id.Selector;
      return `Selector:${word}:${component}`;
    }
  },

  equal(a: GenerationCellDatumId, b: GenerationCellDatumId): boolean {
    return (
      GenerationCellDatumId.toStringKey(a)
        === GenerationCellDatumId.toStringKey(b)
    );
  }
};

export { GenerationStepKind, GenerationPhase, GenerationCellDatumId };
