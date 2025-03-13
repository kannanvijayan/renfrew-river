use super::{
  CogBindGroup,
  CogBindGroupBuilder,
  CogBufferBase,
  CogDevice
};

pub(crate) struct CogComputePipeline {
  pub(crate) device: CogDevice,
  pub(crate) wgpu_compute_pipeline: wgpu::ComputePipeline,
  pub(crate) bind_group_sizes: &'static [u32],
}
impl CogComputePipeline {
  pub(crate) fn new(
    device: &CogDevice,
    wgpu_compute_pipeline: wgpu::ComputePipeline,
    bind_group_sizes: &'static [u32],
  ) -> Self {
    let device = device.clone();
    Self { device, wgpu_compute_pipeline, bind_group_sizes }
  }

  pub(crate) fn build_bind_group(&self, index: usize) -> CogBindGroupBuilder {
    let layout = self.wgpu_compute_pipeline.get_bind_group_layout(index as u32);
    let num_entries = self.bind_group_sizes[index];
    CogBindGroupBuilder::new(&self.device, layout, num_entries)
  }

  pub(crate) fn wgpu_compute_pipeline(&self) -> &wgpu::ComputePipeline {
    &self.wgpu_compute_pipeline
  }
}


pub(crate) struct CogComputePass1D<'a> {
  base: PassBase<'a>,
  extent: u32,
}
impl<'a> CogComputePass1D<'a> {
  pub(crate) fn new(
    wgpu_compute_pass: wgpu::ComputePass<'a>,
    pipeline: CogComputePipeline,
    uniforms_buffer: CogBufferBase,
    extent: u32,
  ) -> Self {
    let base = PassBase::new(wgpu_compute_pass, pipeline, uniforms_buffer);
    Self { base, extent }
  }

  pub(crate) fn add_bind_group<F>(&mut self, f: F)
    where F: FnOnce(CogBindGroupBuilder) -> CogBindGroupBuilder
  {
    self.base.add_bind_group(f);
  }

  pub(crate) fn finish(self, wgsize: u32) {
    let dispatch_x = (self.extent + (wgsize - 1)) / wgsize;
    self.base.dispatch(dispatch_x, 1, 1);
  }
}


pub(crate) struct CogComputePass2D<'a> {
  base: PassBase<'a>,
  extent: [u32; 2],
}
impl<'a> CogComputePass2D<'a> {
  pub(crate) fn new(
    wgpu_compute_pass: wgpu::ComputePass<'a>,
    pipeline: CogComputePipeline,
    uniforms_buffer: CogBufferBase,
    extent: [u32; 2],
  ) -> Self {
    let base = PassBase::new(wgpu_compute_pass, pipeline, uniforms_buffer);
    Self { base, extent }
  }

  pub(crate) fn add_bind_group<F>(&mut self, f: F)
    where F: FnOnce(CogBindGroupBuilder) -> CogBindGroupBuilder
  {
    self.base.add_bind_group(f);
  }

  pub(crate) fn finish(self, wgsize: [u32; 2]) {
    let dispatch_x = (self.extent[0] + (wgsize[0] - 1)) / wgsize[0];
    let dispatch_y = (self.extent[1] + (wgsize[1] - 1)) / wgsize[1];
    self.base.dispatch(dispatch_x, dispatch_y, 1);
  }
}

struct PassBase<'a> {
  pub(crate) wgpu_compute_pass: wgpu::ComputePass<'a>,
  pipeline: CogComputePipeline,
  bind_groups: Vec<CogBindGroup>,
  uniform_buffer: CogBufferBase,
}
impl<'a> PassBase<'a> {
  fn new(
    wgpu_compute_pass: wgpu::ComputePass<'a>,
    pipeline: CogComputePipeline,
    uniform_buffer: CogBufferBase,
  ) -> Self {
    let bind_groups = Vec::new();
    Self { wgpu_compute_pass, pipeline, bind_groups, uniform_buffer }
  }

  fn add_bind_group<F>(&mut self, f: F)
    where F: FnOnce(CogBindGroupBuilder) -> CogBindGroupBuilder
  {
    let bind_group_index = self.bind_groups.len();
    let bind_group_sizes = self.pipeline.bind_group_sizes;
    if self.bind_groups.len() >= bind_group_sizes.len() {
      panic!("Too many bind groups");
    }
    let mut builder = self.pipeline.build_bind_group(bind_group_index);
    if bind_group_index == 0 {
      builder = builder.add_uniform_buffer(&self.uniform_buffer);
    }
    let builder = f(builder);
    let bind_group = builder.build();
    self.bind_groups.push(bind_group);
  }

  fn dispatch(self, x: u32, y: u32, z: u32) {
    let wgpu_bind_groups =
      self.bind_groups.iter()
        .map(|bg| bg.to_wgpu_bind_group(&self.pipeline.device))
        .collect::<Vec<_>>();
    {
      let mut wgpu_pass = self.wgpu_compute_pass;
      wgpu_pass.set_pipeline(self.pipeline.wgpu_compute_pipeline());
      for (i, wgpu_bind_group) in wgpu_bind_groups.iter().enumerate() {
        wgpu_pass.set_bind_group(i as u32, wgpu_bind_group, &[]);
      }
      wgpu_pass.dispatch_workgroups(x, y, z);
    }
  }
}
