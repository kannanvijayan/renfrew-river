use crate::{
  cog::{CogShaderRegistry, CogTask},
  gpu::register_file_buffer::RegisterFileBuffer,
};


pub(crate) struct RandGenTask {
  register_file: RegisterFileBuffer,
}
impl RandGenTask {
  pub(crate) fn new(
    register_file: RegisterFileBuffer
  ) -> Self {
    Self {
      register_file,
    }
  }
}
impl CogTask for RandGenTask {
  fn encode(&self,
    registry: &CogShaderRegistry,
    encoder: &mut wgpu::CommandEncoder
  ) {
  }
}
