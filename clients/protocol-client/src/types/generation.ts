
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

export { GenerationStepKind, GenerationPhase };
