use super::CogTask;

/**
 * Represents a sequences of tasks that can be executed on the GPU
 * in succession in a single invoke.
 */
pub(crate) struct CogInvoke {
  tasks: Vec<Box<dyn CogTask>>,
}
impl CogInvoke {
  pub(crate) fn new() -> Self {
    Self { tasks: Vec::new() }
  }

  pub(crate) fn add_task<T: CogTask + 'static>(&mut self, task: T) {
    self.tasks.push(Box::new(task));
  }

  pub(crate) fn execute(&self, encoder: &mut wgpu::CommandEncoder) {
    for task in &self.tasks {
      task.execute(encoder);
    }
  }
}
