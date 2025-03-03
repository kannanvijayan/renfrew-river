
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GenerationStepKind {
  RandGen,         // NewlyCreated -> PreInitialize
  InitializeCell,  // PreInitialize -> CellInitialized
  PairwiseStep,    // CellInitialized -> PreMerge
  PairwiseMerge,   // PreMerge -> CellInitialized
  Finalize,        // CellInitialized -> Finalized
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GenerationPhase {
  NewlyCreated,
  PreInitialize,
  CellInitialized,
  PreMerge,
  Finalized
}
impl GenerationPhase {
  pub(crate) fn to_str(&self) -> &'static str {
    match self {
      GenerationPhase::NewlyCreated => "NewlyCreated",
      GenerationPhase::PreInitialize => "PreInitialize",
      GenerationPhase::CellInitialized => "CellInitialized",
      GenerationPhase::PreMerge => "PreMerge",
      GenerationPhase::Finalized => "Finalized",
    }
  }
}
