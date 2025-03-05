pub(crate) mod create_world;

/**
 * Collection of all wgsl scripts as strings.
 */

pub(crate) fn shady_interp_script() -> &'static str {
  include_str!("shady_interp.wgsl")
}
