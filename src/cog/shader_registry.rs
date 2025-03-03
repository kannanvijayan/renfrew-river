use std::collections::HashMap;
use crate::cog::CogDevice;
use super::wgsl::create_world;

pub(crate) struct CogShaderRegistry {
  shaders: HashMap<String, ShaderEntry>
}

struct ShaderEntry {
  name: String,
  text: String,
  program: wgpu::ShaderModule
}

impl CogShaderRegistry {
  pub(crate) fn new(device: &CogDevice) -> CogShaderRegistry {
    let mut registry = CogShaderRegistry {
      shaders: HashMap::new()
    };

    registry.add_shader(device, "randgen_task",
      create_world::randgen_task_script());

    registry
  }

  pub(crate) fn get_init_elevations_shader(&self) -> &wgpu::ShaderModule {
    self.get_shader("init_elevations").unwrap()
  }

  fn add_shader(&mut self, device: &CogDevice, name: &str, text: &str) {
    if self.shaders.contains_key(name) {
      panic!("Shader already exists: {}", name);
    }
    let module = device.create_shader_module(text, name);
    self.shaders.insert(name.to_string(), ShaderEntry {
      name: name.to_string(),
      text: text.to_string(),
      program: module
    });
  }

  fn get_shader(&self, name: &str) -> Option<&wgpu::ShaderModule> {
    self.shaders.get(name).map(|entry| &entry.program)
  }
}
