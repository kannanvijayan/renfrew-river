use super::{CogDevice, CogEncoder, CogTask};

/**
 * Represents a sequences of tasks that can be executed on the GPU
 * in succession in a single invoke.
 */
pub(crate) struct CogInvoke {
  device: CogDevice,
  name: &'static str,
  tasks: Vec<Box<dyn CogTask>>,
}
impl CogInvoke {
  pub(crate) fn new(device: &CogDevice, name: &'static str) -> Self {
    let device = device.clone();
    Self { device, name, tasks: Vec::new() }
  }

  pub(crate) fn add_task<T: CogTask + 'static>(&mut self, task: T) {
    self.tasks.push(Box::new(task));
  }

  pub(crate) fn invoke(&self) {
    self.device.encode_and_run(self.name, |encoder| {
      self.encode(encoder);
    });
  }

  pub(crate) fn encode(&self, encoder: &mut CogEncoder) {
    for task in &self.tasks {
      task.encode(encoder);
    }
  }
}
