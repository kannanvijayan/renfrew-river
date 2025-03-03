use super::CogShaderRegistry;


/**
 * A single task (or kernel) that can be executed on the GPU.
 */
pub(crate) trait CogTask {
  /**
   * Execute the task.
   */
  fn encode(&self,
    shader_registry: &CogShaderRegistry,
    encoder: &mut wgpu::CommandEncoder
  );
}
