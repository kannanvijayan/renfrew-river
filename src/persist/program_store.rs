use serde::{ Serialize, Deserialize };
use crate::gpu::{ ShadyProgramIndex, bitcode as bc };


/**
 * Persistable representation of a program store.
 */
#[derive(Serialize, Deserialize)]
pub(crate) struct ProgramStorePersist {
  programs: Vec<ProgramPersist>,
}
impl ProgramStorePersist {
  pub(crate) fn new(programs: Vec<ProgramPersist>) -> ProgramStorePersist {
    ProgramStorePersist { programs }
  }
}

/**
 * Persistable representation of a program.
 */
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
}
