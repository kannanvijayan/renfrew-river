use crate::{
  cog::{CogDevice, CogMapBuffer},
  world::{ CellData, WorldDims },
};

#[derive(Clone)]
pub(crate) struct CellDataBuffer {
  buffer: CogMapBuffer<CellData>
}
impl CellDataBuffer {
  pub(crate) fn new(device: &CogDevice, dims: WorldDims) -> Self {
    let buffer = CogMapBuffer::new_uninit(device, dims, "cell_data");
    CellDataBuffer { buffer }
  }
}
