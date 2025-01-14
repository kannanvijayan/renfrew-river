
/**
 * Collection of all wgsl scripts as strings.
 */


pub fn fancy_copy_script() -> &'static str {
  include_str!("./fancy_copy.wgsl")
}

pub fn shady_interp_script() -> &'static str {
  include_str!("./shady_interp.wgsl")
}
