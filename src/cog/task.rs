
/**
 * A single task (or kernel) that can be executed on the GPU.
 */
pub(crate) trait CogTask {
  /**
   * Execute the task.
   */
  fn execute(&self, encoder: &mut wgpu::CommandEncoder);
}
