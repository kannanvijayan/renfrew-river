use crate::{
  cog::{CogDevice, CogShaderModule},
  gpu::wgsl::create_world,
};

pub(crate) struct ShaderRegistry {
  pub(crate) create_world: CreateWorldShaderRegistry
}

impl ShaderRegistry {
  pub(crate) fn new(device: &CogDevice) -> ShaderRegistry {
    let create_world = CreateWorldShaderRegistry::new(device);
    ShaderRegistry { create_world }
  }
}

pub(crate) struct CreateWorldShaderRegistry {
  pub(crate) rand_gen: CogShaderModule<create_world::RandGenShaderScript>
}
impl CreateWorldShaderRegistry {
  pub(crate) fn new(device: &CogDevice) -> CreateWorldShaderRegistry {
    let rand_gen =
      device.create_shader_module::<create_world::RandGenShaderScript>();
    CreateWorldShaderRegistry { rand_gen }
  }
}
