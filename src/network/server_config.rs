
/**
 * Server configuration
 */
pub struct NetworkServerConfig {
  pub serve_addr: String,
}
impl NetworkServerConfig {
  pub fn new(serve_addr: String) -> NetworkServerConfig {
    NetworkServerConfig { serve_addr }
  }

  pub fn default() -> NetworkServerConfig {
    NetworkServerConfig::new("127.0.0.1:3030".to_string())
  }
}