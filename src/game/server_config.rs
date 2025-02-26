use std::env;

/**
 * Server configuration
 */
#[derive(Debug, Clone)]
pub struct GameServerConfig {
  pub data_root: String,
}
impl GameServerConfig {
  pub fn new(data_root: String) -> GameServerConfig {
    GameServerConfig { data_root }
  }

  pub fn default() -> GameServerConfig {
    GameServerConfig { data_root: default_data_root() }
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
