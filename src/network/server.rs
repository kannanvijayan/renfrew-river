use std::{
  net::SocketAddr,
  str::FromStr,
};
use serde_json;
use log;
use futures_util::{ SinkExt, StreamExt, stream::SplitSink };
use warp::{
  Filter,
  filters::ws::WebSocket,
  ws::Message,
};
use crate::{
  network::{NetworkServerConfig, ServerState},
  protocol::CommandEnvelope,
};

/**
 * The network server.  Fronts a game-server over a socket.
 */
pub async fn ws_serve(config: NetworkServerConfig) {

  let server_state = ServerState::new();

  log::debug!("serve");
  // Serve websocket on '/ws'
  let routes = warp::path::end()
    .and(warp::ws())
    .and(with_server_state(server_state.clone()))
    .map(|ws: warp::ws::Ws, server_state: ServerState| {
      ws.on_upgrade(|websocket| async move {
        log::debug!("ws_serve: websocket-upgraded");
        if server_state.has_client() {
          log::warn!("ws_serve: already-has-client");
          return;
        }
        serve_socket(websocket, server_state).await;
      })
    });

  let addr = match SocketAddr::from_str(&config.serve_addr) {
    Ok(addr) => addr,
    Err(error) => {
      log::error!("ws_serve: failed-to-parse {} error={:?}", &config.serve_addr, error);
      return;
    }
  };
  warp::serve(routes)
    .run(addr).await;
}

/**
 * Handle a single websocket connection.
 */
async fn serve_socket(websocket: WebSocket, server_state: ServerState) {
  log::debug!("serve_socket");
  let (mut tx, mut rx) = websocket.split();

  while let Some(result) = rx.next().await {
    let message = match result {
      Ok(message) => message,
      Err(error) => {
        log::error!("serve_socket: error: {:?}", error);
        break;
      }
    };
    log::info!("serve_socket: message: {:?}", message);
    let ok = handle_message(&server_state, &mut tx, message).await;
    if !ok {
      break;
    }
  }

  log::info!("NetworkServer.serve_socket: client-disconnected");
  server_state.set_has_client(false);
}

/**
 * Handle a message from the client.
 */
async fn handle_message(server_state: &ServerState, tx: &mut SplitSink<WebSocket, Message>, message: Message) -> bool {
  if message.is_text() {
    let msgtext = message.to_str().unwrap();
    log::debug!("NetworkServer.handle_message: text-message: {:?}", msgtext);
    // Deserialize the message to a command envelope using serde_json.
    let command_envelope = match serde_json::from_str::<CommandEnvelope>(msgtext) {
      Ok(message) => message,
      Err(error) => {
        log::warn!("NetworkServer.handle_message: failed-to-deserialize: {:?}", error);
        return false;
      }
    };

    // Handle the command.
    let response_envelope = server_state.handle_command(command_envelope);

    // Serialize the response and send it.
    let response_string = match serde_json::to_string(&response_envelope) {
      Ok(response) => response,
      Err(error) => {
        log::warn!("NetworkServer.handle_message: failed-to-serialize: {:?}", error);
        return false;
      }
    };

    if response_string.len() > 256 {
      log::debug!(
        "NetworkServer.handle_message: sending-response: {:?}...",
        &response_string[0..256]
      );
    } else {
      log::debug!("NetworkServer.handle_message: sending-response: {:?}", response_string);
    }
    match tx.send(Message::text(response_string)).await {
      Ok(_) => {
        log::debug!("NetworkServer.handle_message: response-sent");
        return true;
      },
      Err(error) => {
        log::error!("NetworkServer.handle_message: failed-to-send-response: {:?}", error);
        return false;
      }
    }
  } else if message.is_ping() {
    log::warn!("NetworkServer.handle_message: ping received.  Ignoring.");
    return true;
  } else {
    log::warn!("NetworkServer.handle_message: non-text-message-received");
    return false;
  }
}

// Helper to pass server state to warp message handler.
fn with_server_state(state: ServerState)
  -> impl Filter< Extract = (ServerState,), Error = std::convert::Infallible>
   + Clone
{
  warp::any().map(move || state.clone())
}
