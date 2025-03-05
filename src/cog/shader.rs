use std::{
  rc::Rc,
  cell::{ Ref, RefCell },
  collections::HashMap,
  marker::PhantomData,
  ops::Deref,
};
use crate::cog::CogDevice;
use super::{
  CogComputePass1D,
  CogComputePass2D,
  CogEncoder,
  CogUniformType,
  CogComputePipeline,
};

pub(crate) trait CogShaderScript: 'static {
  type Uniforms: CogUniformType;

  const NAME: &'static str;
  const SOURCE: &'static str;
  const BIND_GROUPS: &'static [u32];
}

pub(crate) trait CogShaderEntrypoint1D<S: CogShaderScript>: 'static {
  const NAME: &'static str;
  const WORKGROUP_SIZE: u32;
}

pub(crate) trait CogShaderEntrypoint2D<S: CogShaderScript>: 'static {
  const NAME: &'static str;
  const WORKGROUP_SIZE: [u32; 2];
}

pub(crate) struct CogShaderModule<S: CogShaderScript> {
  pub(crate) device: CogDevice,
  pub(crate) wgpu_module: Rc<wgpu::ShaderModule>,
  pub(crate) _phantom: PhantomData<S>
}
impl<S: CogShaderScript> CogShaderModule<S> {

  pub(crate) fn add_compute_pass_1d<E, F>(&self,
    encoder: &mut CogEncoder,
    uniforms: S::Uniforms,
    extent: u32,
    name: &str,
    func: F,
  )
    where E: CogShaderEntrypoint1D<S>,
          F: FnOnce (&mut CogComputePass1D)
  {
    let pipeline = self.create_pipeline_1d::<E>();
    let uniforms_buffer_name = format!("{}_uniforms", name);
    let uniforms_buffer = encoder.device().create_uniform_buffer(
      &uniforms_buffer_name, uniforms
    );
    let wgpu_compute_pass = encoder.wgpu_begin_compute_pass(name);
    let mut pass = CogComputePass1D::new(
      wgpu_compute_pass, pipeline, uniforms_buffer.base, extent
    );
    func(&mut pass);
    pass.finish(E::WORKGROUP_SIZE);
  }

  pub(crate) fn add_compute_pass_2d<E, F>(&self,
    encoder: &mut CogEncoder,
    uniforms: S::Uniforms,
    extent: [u32; 2],
    name: &str,
    func: F,
  )
    where E: CogShaderEntrypoint2D<S>,
          F: FnOnce (&mut CogComputePass2D)
  {
    let pipeline = self.create_pipeline_2d::<E>();
    let uniforms_buffer_name = format!("{}_uniforms", name);
    let uniforms_buffer = encoder.device().create_uniform_buffer(
      &uniforms_buffer_name, uniforms
    );
    let wgpu_compute_pass = encoder.wgpu_begin_compute_pass(name);
    let mut pass = CogComputePass2D::new(
      wgpu_compute_pass, pipeline, uniforms_buffer.base, extent
    );
    func(&mut pass);
    pass.finish(E::WORKGROUP_SIZE);
  }


  fn create_pipeline_1d<E>(&self) -> CogComputePipeline
    where E: CogShaderEntrypoint1D<S>
  {
    let wgpu_pipeline = self.create_wgpu_pipeline(E::NAME);
    CogComputePipeline::new(&self.device, wgpu_pipeline, S::BIND_GROUPS)
  }

  fn create_pipeline_2d<E>(&self) -> CogComputePipeline
    where E: CogShaderEntrypoint2D<S>
  {
    let wgpu_pipeline = self.create_wgpu_pipeline(E::NAME);
    CogComputePipeline::new(&self.device, wgpu_pipeline, S::BIND_GROUPS)
  }

  fn create_wgpu_pipeline(&self, name: &str) -> wgpu::ComputePipeline {
    self.device.wgpu_device().create_compute_pipeline(
      &wgpu::ComputePipelineDescriptor {
        label: Some(&format!("{}_{}", S::NAME, name)),
        layout: None,
        module: &self.wgpu_module,
        entry_point: name,
      }
    )
  }
}

pub(crate) struct CogShaderStore {
  shaders: RefCell<HashMap<String, ShaderEntry>>
}

impl CogShaderStore {
  pub(crate) fn new() -> CogShaderStore {
    let shaders = RefCell::new(HashMap::new());
    CogShaderStore { shaders }
  }

  pub(crate) fn get_or_create_shader_module<S: CogShaderScript>(&self,
    device: &CogDevice
  ) -> CogShaderModule<S> {
    let wgpu_module = self.get_or_create_shader(device, S::NAME, S::SOURCE);
    let device = device.clone();
    CogShaderModule { device, wgpu_module, _phantom: PhantomData }
  }

  fn get_or_create_shader(&self, device: &CogDevice, name: &str, text: &str)
    -> Rc<wgpu::ShaderModule>
  {
    let name = name.to_string();
    let mut shaders = self.shaders.borrow_mut();
    let value = shaders.entry(name.clone()).or_insert_with(|| {
      let module = Rc::new(device.wgpu_device().create_shader_module(
        wgpu::ShaderModuleDescriptor {
          label: Some(&name),
          source: wgpu::ShaderSource::Wgsl(text.into()),
        }
      ));
      ShaderEntry {
        name: name.clone(),
        text: text.to_string(),
        module
      }
    });
    value.module.clone()
  }
}

struct ShaderEntry {
  name: String,
  text: String,
  module: Rc<wgpu::ShaderModule>
}

struct GetModule<'a>(Ref<'a, ShaderEntry>);
impl<'a> Deref for GetModule<'a> {
  type Target = wgpu::ShaderModule;

  fn deref(&self) -> &Self::Target {
    &self.0.module
  }
}
