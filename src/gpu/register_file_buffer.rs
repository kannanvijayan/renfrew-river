use crate::{
  cog::CogSeqBuffer,
  shady_vm::ShadyRegisterFile,
};

#[derive(Clone)]
pub(crate) struct RegisterFileBuffer {
  buffer: CogSeqBuffer<ShadyRegisterFile>,
}
