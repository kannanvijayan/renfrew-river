use crate::{
  cog::{ CogDevice, CogMapBuffer, CogSeqBuffer },
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

  pub(crate) fn as_u32_seq_buffer(&self) -> CogSeqBuffer<u32> {
    self.buffer.as_seq_buffer().cast_resized::<u32>()
  }
}
