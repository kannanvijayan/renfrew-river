use serde::{ Serialize, Deserialize };
use crate::gpu::{ ShadyProgramIndex, bitcode as bc };


/**
 * Persistable representation of a program store.
 */
#[derive(Debug, Clone)]
#[derive(Serialize, Deserialize)]
pub(crate) struct ProgramStorePersist {
  programs: Vec<ProgramPersist>,
}
impl ProgramStorePersist {
  pub(crate) fn new(programs: Vec<ProgramPersist>) -> ProgramStorePersist {
    ProgramStorePersist { programs }
  }

  pub(crate) fn programs(&self) -> &[ProgramPersist] {
    &self.programs
  }
}

/**
 * Persistable representation of a program.
 */
#[derive(Debug, Clone)]
#[derive(Serialize, Deserialize)]
pub(crate) struct ProgramPersist {
  name: String,
  index: ShadyProgramIndex,
  instructions: Vec<bc::Instruction>,
}
impl ProgramPersist {
  pub(crate) fn new(
    name: String,
    index: ShadyProgramIndex,
    instructions: Vec<bc::Instruction>
  ) -> ProgramPersist {
    ProgramPersist { name, index, instructions }
  }

  pub(crate) fn name(&self) -> &str {
    &self.name
  }

  pub(crate) fn index(&self) -> ShadyProgramIndex {
    self.index
  }

  pub(crate) fn instructions(&self) -> &[bc::Instruction] {
    &self.instructions
  }
}
