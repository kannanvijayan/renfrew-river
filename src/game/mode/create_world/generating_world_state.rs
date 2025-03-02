use crate::{
  cog::{ CogDevice, CogMapBuffer, CogSeqBuffer },
  gpu::{CellDataBuffer, ProgramBuffer},
  world::{ CellData, WorldDescriptor },
};

pub(crate) struct GeneratingWorldState {
  descriptor: WorldDescriptor,
  gpu_state: GpuState,
}
impl GeneratingWorldState {
  pub(crate) fn new(descriptor: WorldDescriptor) -> Self {
    let gpu_state = GpuState::new(descriptor.clone());
    GeneratingWorldState { descriptor, gpu_state }
  }
}

struct GpuState {
  descriptor: WorldDescriptor,
  device: CogDevice,
  cell_data_buffer: CellDataBuffer,
  program_buffer: ProgramBuffer,
}
impl GpuState {
  fn new(descriptor: WorldDescriptor) -> Self {
    let device = CogDevice::new();
    let cell_data_buffer = CellDataBuffer::new(&device, descriptor.dims);
    let program_buffer = ProgramBuffer::new(&device);
    GpuState {
      descriptor,
      device,
      cell_data_buffer,
      program_buffer,
    }
  }
}
