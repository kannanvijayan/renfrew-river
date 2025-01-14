
/*
 * COG = Compute on GPU
 */

mod buffer;
mod device;
mod task;
mod invoke;
mod wgsl;

pub(crate) use self::{
  device::CogDevice,
  task::CogTask,
  invoke::CogInvoke,
};
