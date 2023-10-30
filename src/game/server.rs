use log;
use std::{
  thread::JoinHandle,
  sync::mpsc,
};
use crate::{
  game::{
    GameSettings,
    Game,
    command::{
      Command, CommandEnvelope,
      NewGameCmd, NewGameRsp,
      StopGameCmd, StopGameRsp,
      HasGameCmd, HasGameRsp, GameExistsResponse,
      GetConstantsCmd, GetConstantsRsp,
      DefaultSettingsCmd, DefaultSettingsRsp,
      ReadElevationsCmd, ReadElevationsRsp, ElevationsResponse,
      MiniElevationsCmd, MiniElevationsRsp, MiniElevationsResponse,
      ReadAnimalsCmd, ReadAnimalsRsp, AnimalsResponse,
    },
    response::{
      ResponseEnvelope,
      FailedResponse,
    },
    settings::{ MAX_WORLD_DIMS, MIN_WORLD_DIMS }
  },
  world::TERRAIN_ELEVATION_BITS,
};

/**
 * A server that fronts the game engine running on another thread.
 * Provides a rust API for interacting with the game, and a generic
 * `perform_command` method for usage by the network server.
 */
pub(crate) struct GameServer {
  // The join-handle for the game thread.
  join_handle: Option<JoinHandle<()>>,

  // A mpsc channel for sending messages to the game thread.
  command_tx: mpsc::Sender<CommandEnvelope>,

  // An mpsc channel for receving responses and events from the game thread.
  response_rx: mpsc::Receiver<ResponseEnvelope>,
}
impl GameServer {
  pub(crate) fn new() -> GameServer {
    GameServerInner::start_thread()
  }

  pub(crate) fn perform_command(&self, command: CommandEnvelope) -> ResponseEnvelope {
    log::debug!("GameServer::perform_command");
    self.command_tx.send(command).unwrap();
    let response = match self.response_rx.recv() {
      Ok(response) => response,
      Err(err) => {
        panic!("GameServer::perform_command: response channel errored: {:?}", err);
      }
    };
    response
  }

  pub(crate) fn default_settings(&self) -> GameSettings {
    log::debug!("GameServer::default_settings");
    let default_settings_command = DefaultSettingsCmd {};
    self.command_tx.send(
      CommandEnvelope::DefaultSettings(Box::new(default_settings_command))
    ).unwrap();
    let response = self.await_response::<DefaultSettingsCmd>();
    response.settings
  }

  pub(crate) fn has_game(&self) -> bool {
    log::debug!("GameServer::has_game");
    let has_game_command = HasGameCmd {};
    self.command_tx.send(
      CommandEnvelope::HasGame(Box::new(has_game_command))
    ).unwrap();
    let response = self.await_response::<HasGameCmd>();
    match response {
      HasGameRsp::GameExists(_) => {
        log::debug!("GameServer::has_game: GameExists");
        true
      },
      HasGameRsp::NoGameExists => {
        log::debug!("GameServer::has_game: NoGameExists");
        false
      }
    }
  }

  pub(crate) fn new_game(&self, settings: GameSettings) -> bool {
    log::debug!("GameServer::new_game");
    let new_command = NewGameCmd { settings };
    self.command_tx.send(
      CommandEnvelope::NewGame(Box::new(new_command))
    ).unwrap();
    let response = self.await_response::<NewGameCmd>();
    match response {
      NewGameRsp::Ok{} => {
        log::debug!("GameServer::new_game: NewGameCreated");
        true
      },
      NewGameRsp::Failed(_) => {
        log::warn!("GameServer::new_game: NewGameFailed");
        false
      }
    }
  }

  pub(crate) fn stop_game(&mut self) {
    log::debug!("GameServer::stop");
    if self.join_handle.is_none() {
      log::warn!("GameServer::stop: Already stopped");
      return;
    }
    let join_handle = self.join_handle.take().unwrap();
    let stop_command = StopGameCmd {};
    self.command_tx.send(
      CommandEnvelope::StopGame(Box::new(stop_command))
    ).unwrap();
    let join_result = join_handle.join();
    match join_result {
      Ok(_) => {
        log::debug!("GameServer::stop: Joined thread");
      },
      Err(_) => {
        log::error!("GameServer::stop: Failed to join thread");
      }
    }
  }

  fn await_response<C: Command>(&self) -> C::Response {
    let response = match self.response_rx.recv() {
      Ok(response) => response,
      Err(err) => {
        panic!(
          "GameServer::await_response: response channel errored: {:?}",
          err
        );
      }
    };

    match C::extract_response(&response) {
      Some(response) => response,
      None => {
        panic!(
          "GameServer::await_response: unexpected response: {:?}",
          response
        );
      }
    }
  }
}

pub(crate) struct GameServerInner {
  command_rx: mpsc::Receiver<CommandEnvelope>,
  response_tx: mpsc::Sender<ResponseEnvelope>,
  game: Option<Game>,
  stop: bool,
}
impl GameServerInner {
  pub(crate) fn start_thread() -> GameServer {
    let (command_tx, command_rx) = mpsc::channel::<CommandEnvelope>();
    let (response_tx, response_rx) = mpsc::channel::<ResponseEnvelope>();
    let join_handle = std::thread::spawn(move || {
      let mut inner = GameServerInner {
        command_rx,
        response_tx,
        game: None,
        stop: false,
      };
      inner.run();
    });

    GameServer {
      join_handle: Some(join_handle),
      command_tx,
      response_rx,
    }
  }

  fn run(&mut self) {
    loop {
      match self.command_rx.recv() {
        Ok(command) => {
          let response = self.handle_command(command);
          if let Err(err) = self.response_tx.send(response) {
            log::error!("GameServer thread: FailedToSendResponse: {:?}", err);
          }
          if self.stop {
            break;
          }
        },
        Err(_) => {
          log::error!("GameServer thread: command channel errored");
          break;
        }
      }
    }
  }

  fn handle_command(&mut self, command: CommandEnvelope) -> ResponseEnvelope {
    match command {
      CommandEnvelope::GetConstants(get_constants_command) => {
        let resp = self.handle_get_constants_command(*get_constants_command);
        return GetConstantsCmd::embed_response(resp);
      },
      CommandEnvelope::HasGame(has_game_command) => {
        let resp = self.handle_has_game_command(*has_game_command);
        return HasGameCmd::embed_response(resp);
      },
      CommandEnvelope::DefaultSettings(default_settings_command) => {
        let resp = self.handle_default_settings_command(*default_settings_command);
        return DefaultSettingsCmd::embed_response(resp);
      },
      CommandEnvelope::NewGame(new_command) => {
        let resp = self.handle_new_command(*new_command);
        return NewGameCmd::embed_response(resp);
      },
      CommandEnvelope::StopGame(stop_command) => {
        let resp = self.handle_stop_command(*stop_command);
        return StopGameCmd::embed_response(resp);
      },
      CommandEnvelope::ReadElevations(read_elevations_command) => {
        let resp = self.handle_read_elevations_command(*read_elevations_command);
        return ReadElevationsCmd::embed_response(resp);
      },
      CommandEnvelope::MiniElevations(mini_elevations_command) => {
        let resp = self.handle_mini_elevations_command(*mini_elevations_command);
        return MiniElevationsCmd::embed_response(resp);
      },
      CommandEnvelope::ReadAnimals(read_animals_command) => {
        let resp = self.handle_read_animals_command(*read_animals_command);
        return ReadAnimalsCmd::embed_response(resp);
      },
    };
  }

  fn handle_get_constants_command(&mut self,
    _get_constants_command: GetConstantsCmd
  ) -> GetConstantsRsp {
    log::debug!("GameServerInner::handle_get_constants_command");
    GetConstantsRsp {
      elevation_bits: TERRAIN_ELEVATION_BITS,
      min_world_dims: MIN_WORLD_DIMS,
      max_world_dims: MAX_WORLD_DIMS,
    }
  }

  fn handle_has_game_command(&mut self, _has_game_command: HasGameCmd) -> HasGameRsp {
    log::debug!("GameServerInner::handle_has_game_command");
    match self.game {
      Some(ref game) => {
        HasGameRsp::GameExists(GameExistsResponse::new(game.settings().clone()))
      },
      None => HasGameRsp::NoGameExists,
    }
  }

  fn handle_default_settings_command(&mut self,
    _default_settings_command: DefaultSettingsCmd
  ) -> DefaultSettingsRsp {
    log::debug!("GameServerInner::handle_default_settings_command");
    DefaultSettingsRsp {
      settings: GameSettings::default(),
      min_world_dims: MIN_WORLD_DIMS,
      max_world_dims: MAX_WORLD_DIMS,
    }
  }

  fn handle_new_command(&mut self, new_command: NewGameCmd) -> NewGameRsp {
    log::debug!("GameServerInner::handle_new_command");

    // Validate command.
    let mut validation_errors = Vec::new();
    if !new_command.validate(&mut validation_errors) {
      log::warn!("GameServerInner::handle_new_command: Invalid command: {:?}", validation_errors);
      return NewGameRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let settings = new_command.settings;
    let mut game = Game::new(settings);
    game.initialize();
    self.game = Some(game);
    NewGameRsp::Ok{}
  }

  fn handle_stop_command(&mut self, _stop_command: StopGameCmd) -> StopGameRsp {
    log::debug!("GameServerInner::handle_stop_command");
    let mut game = match self.game.take() {
      Some(game) => game,
      None => {
        log::warn!("GameServerInner::handle_stop_command: No game to stop");
        return StopGameRsp::Failed(FailedResponse::new("No game to stop"));
      }
    };
    game.stop();
    self.stop = true;
    StopGameRsp::Ok
  }

  fn handle_read_elevations_command(&mut self,
    read_elevations_cmd: ReadElevationsCmd
  ) -> ReadElevationsRsp {

    // Validate command.
    let mut validation_errors = Vec::new();
    if !read_elevations_cmd.validate(&mut validation_errors) {
      log::warn!("GameServerInner::handle_new_command: Invalid command: {:?}", validation_errors);
      return ReadElevationsRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let game = match self.game {
      Some(ref game) => game,
      None => {
        log::warn!(
          "GameServerInner::handle_read_elevations_command: No game to read elevations from"
        );
        return ReadElevationsRsp::Failed(
          FailedResponse::new("No game to read elevations from")
        );
      }
    };

    let ReadElevationsCmd { top_left, area } = read_elevations_cmd;

    if (top_left.col_usize() + area.columns_usize() > u16::MAX as usize)
    || (top_left.row_usize() + area.rows_usize() > u16::MAX as usize)
    {
      return ReadElevationsRsp::Failed(
        FailedResponse::new("Slice out of bounds")
      );
    }

    let elevs = game.world().read_elevation_values(top_left, area);
    ReadElevationsRsp::Ok(ElevationsResponse {
      elevations: elevs.to_vec_of_vecs(),
    })
  }

  fn handle_mini_elevations_command(&mut self,
    mini_elevations_cmd: MiniElevationsCmd
  ) -> MiniElevationsRsp {

    // Validate command.
    let mut validation_errors = Vec::new();
    if !mini_elevations_cmd.validate(&mut validation_errors) {
      log::warn!("GameServerInner::handle_new_command: Invalid command: {:?}", validation_errors);
      return MiniElevationsRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let game = match self.game {
      Some(ref game) => game,
      None => {
        log::warn!(
          "GameServerInner::handle_read_elevations_command: No game to read elevations from"
        );
        return MiniElevationsRsp::Failed(
          FailedResponse::new("No game to minify elevations from")
        );
      }
    };

    let mini_dims = mini_elevations_cmd.mini_dims;
    let result = game.world()
      .mini_elevation_values(mini_dims)
      .to_vec_of_vecs();

    MiniElevationsRsp::Ok(MiniElevationsResponse {
      elevations: result,
    })
  }

  fn handle_read_animals_command(&mut self,
    read_animals_cmd: ReadAnimalsCmd,
  ) -> ReadAnimalsRsp {

    // Validate command.
    let mut validation_errors = Vec::new();
    if !read_animals_cmd.validate(&mut validation_errors) {
      log::warn!("GameServerInner::read_animals: Invalid command: {:?}",
        validation_errors
      );
      return ReadAnimalsRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let game = match self.game {
      Some(ref game) => game,
      None => {
        log::warn!(
          "GameServerInner::handle_read_animals_command: No game to read animals from"
        );
        return ReadAnimalsRsp::Failed(
          FailedResponse::new("No game to read animals from")
        );
      }
    };

    let animals = game.world().read_animals_entity_data();
    ReadAnimalsRsp::Ok(AnimalsResponse { animals })
  }
}