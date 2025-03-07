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
  }
}

export { GenerationStepKind, GenerationPhase, GenerationCellDatumId };
