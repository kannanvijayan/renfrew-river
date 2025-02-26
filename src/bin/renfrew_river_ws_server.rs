use tokio;
use env_logger;
use clap::Parser;
use renfrew_river::{ ws_serve, NetworkServerConfig };

#[derive(Parser, Debug)]
#[clap(name="renfrew_river_ws_server")]
#[command(
  version="0.1.0",
  author="Kannan Vijayan",
  about="Renfrew River WebSocket server"
)]
struct CommandLineArgs {
  /** Address to serve on. */
  #[clap(short, long, name="serve-addr")]
  serve_addr: Option<String>,

  /** Root path of data store. */
  #[clap(short, long, name="data-root")]
  data_root: Option<String>,
}

#[tokio::main(flavor = "current_thread")]
pub async fn main() {
  env_logger::init();

  let args = CommandLineArgs::parse();

  // Create a new game server thread.
  let mut network_server_config = NetworkServerConfig::default();

  if let Some(ref serve_addr) = args.serve_addr {
    network_server_config.serve_addr = serve_addr.clone();
  }

  if let Some(ref data_root) = args.data_root {
    network_server_config.data_root = data_root.clone();
  }

  ws_serve(network_server_config).await;
}
