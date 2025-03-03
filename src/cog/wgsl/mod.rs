
/**
 * Collection of all wgsl scripts as strings.
 */

pub(crate) fn shady_interp_script() -> &'static str {
  include_str!("shady_interp.wgsl")
}

pub(crate) mod create_world {
  pub(crate) fn randgen_task_script() -> &'static str {
    include_str!("create_world/randgen_task.wgsl")
  }
}
