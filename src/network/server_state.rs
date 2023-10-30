use std::sync::{
  Arc,
  Mutex,
  atomic::{ AtomicBool, Ordering },
};
use crate::game::{
  GameServer,
  CommandEnvelope,
  ResponseEnvelope,
};

struct ServerStateInner {
  game_server: Mutex<GameServer>,
  has_client: AtomicBool,
}

#[derive(Clone)]
pub(crate) struct ServerState(Arc<ServerStateInner>);
impl ServerState {
  pub(crate) fn new() -> ServerState {
    let inner = ServerStateInner {
      game_server: Mutex::new(GameServer::new()),
      has_client: AtomicBool::new(false),
    };
    ServerState(Arc::new(inner))
  }
  pub(crate) fn has_client(&self) -> bool {
    self.0.has_client.load(Ordering::SeqCst)
  }
  pub(crate) fn set_has_client(&self, value: bool) {
    self.0.has_client.store(value, Ordering::SeqCst);
  }
  pub(crate) fn handle_command(&self,
    command_envelope: CommandEnvelope
  ) -> ResponseEnvelope {
    let game_server = self.0.game_server.lock().unwrap();
    game_server.perform_command(command_envelope)
  }
}