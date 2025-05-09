use std::env;

/**
 * Server configuration
 */
pub struct NetworkServerConfig {
  pub serve_addr: String,
  pub data_root: String,
}
impl NetworkServerConfig {
  pub fn new(serve_addr: String, data_root: String) -> NetworkServerConfig {
    NetworkServerConfig { serve_addr, data_root }
  }

  pub fn default() -> NetworkServerConfig {
    // Read data root from system environment.
    NetworkServerConfig::new(
      "127.0.0.1:3030".to_string(),
      default_data_root(),
    )
  }
}

fn default_data_root() -> String {
  let env_data_root = env::var("RENFREW_RIVER_DATA_ROOT");
  if let Ok(data_root) = env_data_root {
    return data_root;
  }

  let env_home = std::env::var("HOME");
  if let Ok(home) = env_home {
    return format!("{}/.renfrew_river", home);
  }

  // Create a temporary directory.
  let temp_dir = env::temp_dir();
  return format!("{}/renfrew_river", temp_dir.to_str().unwrap());
}
