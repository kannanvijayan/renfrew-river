use super::CogEncoder;


/**
 * A single task (or kernel) that can be executed on the GPU.
 */
pub(crate) trait CogTask {
  /** Encode the task into the given encoder. */
  fn encode(&self, encoder: &mut CogEncoder);
}
