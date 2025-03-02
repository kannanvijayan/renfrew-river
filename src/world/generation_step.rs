
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GenerationStepKind {
  RandGen,         // NewlyCreated -> PreInitialize
  InitializeCell,  // PreInitialize -> CellInitialized
  PairwiseStep,    // CellInitialized -> PreMerge
  PairwiseMerge,   // PreMerge -> CellInitialized
  Finalize,        // CellInitialized -> Finalized
}
