use tokio;
use env_logger;
use renfrew_river::{ ws_serve, NetworkServerConfig };

#[tokio::main(flavor = "current_thread")]
pub async fn main() {
  env_logger::init();

  // Create a new game server thread.
  let network_server_config = NetworkServerConfig::default();
  ws_serve(network_server_config).await;
}