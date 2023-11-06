use log;
use std::{
  thread::JoinHandle,
  sync::mpsc,
};
use crate::{
  game::{
    GameSettings,
    Game,
    constants::{ ELEVATION_BITS, MIN_WORLD_DIMS, MAX_WORLD_DIMS },
    command::{
      Command, CommandEnvelope,
      NewGameCmd, NewGameRsp,
      StopGameCmd, StopGameRsp,
      HasGameCmd, HasGameRsp, GameExistsResponse,
      GetConstantsCmd, GetConstantsRsp,
      DefaultSettingsCmd, DefaultSettingsRsp,
      ReadMapDataCmd, ReadMapDataKind, ReadMapDataRsp, MapDataResponse,
      MiniElevationsCmd, MiniElevationsRsp, MiniElevationsResponse,
      ReadAnimalsCmd, ReadAnimalsRsp, AnimalsResponse,
      TakeTurnStepCmd, TakeTurnStepRsp, TurnTakenResponse,
      GetCellInfoCmd, GetCellInfoRsp,
    },
    response::{
      ResponseEnvelope,
      FailedResponse,
    },
  },
  world::{
    ElevationValueType,
    AnimalId,
    TakeTurnStepResult,
  },
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
      CommandEnvelope::ReadMapData(read_elevations_command) => {
        let resp = self.handle_read_elevations_command(*read_elevations_command);
        return ReadMapDataCmd::embed_response(resp);
      },
      CommandEnvelope::MiniElevations(mini_elevations_command) => {
        let resp = self.handle_mini_elevations_command(*mini_elevations_command);
        return MiniElevationsCmd::embed_response(resp);
      },
      CommandEnvelope::ReadAnimals(read_animals_command) => {
        let resp = self.handle_read_animals_command(*read_animals_command);
        return ReadAnimalsCmd::embed_response(resp);
      },
      CommandEnvelope::TakeTurnStep(take_turn_step_command) => {
        let resp = self.handle_take_turn_step_command(*take_turn_step_command);
        return TakeTurnStepCmd::embed_response(resp);
      }
      CommandEnvelope::GetCellInfo(get_cell_info_command) => {
        let resp = self.handle_get_cell_info_command(*get_cell_info_command);
        return GetCellInfoCmd::embed_response(resp);
      }
    };
  }

  fn handle_get_constants_command(&mut self,
    _get_constants_command: GetConstantsCmd
  ) -> GetConstantsRsp {
    log::debug!("GameServerInner::handle_get_constants_command");
    GetConstantsRsp {
      elevation_bits: ELEVATION_BITS,
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
        log::warn!("GameServerInner::handle_stop_command: No game");
        return StopGameRsp::Failed(FailedResponse::new("No game to stop"));
      }
    };
    game.stop();
    self.stop = true;
    StopGameRsp::Ok
  }

  fn handle_read_elevations_command(&mut self,
    read_elevations_cmd: ReadMapDataCmd
  ) -> ReadMapDataRsp {

    // Validate command.
    let mut validation_errors = Vec::new();
    if !read_elevations_cmd.validate(&mut validation_errors) {
      log::warn!("GameServerInner::handle_new_command: Invalid command: {:?}", validation_errors);
      return ReadMapDataRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let game = match self.game {
      Some(ref game) => game,
      None => {
        log::warn!(
          "GameServerInner::handle_read_elevations_command: No game"
        );
        return ReadMapDataRsp::Failed(
          FailedResponse::new("No game to read elevations from")
        );
      }
    };

    let ReadMapDataCmd { top_left, area, kinds } = read_elevations_cmd;

    if (top_left.col_usize() + area.columns_usize() > u16::MAX as usize)
    || (top_left.row_usize() + area.rows_usize() > u16::MAX as usize)
    {
      return ReadMapDataRsp::Failed(
        FailedResponse::new("Slice out of bounds")
      );
    }

    let mut elevations: Option<Vec<Vec<ElevationValueType>>> = None;
    if kinds.contains(&ReadMapDataKind::Elevation) {
      elevations = Some(
        game.world().read_elevation_values(top_left, area).to_vec_of_vecs()
      );
    }

    let mut animal_ids: Option<Vec<Vec<AnimalId>>> = None;
    if kinds.contains(&ReadMapDataKind::AnimalId) {
      animal_ids = Some(
        game.world().read_animal_ids(top_left, area).to_vec_of_vecs()
      );
    }
    ReadMapDataRsp::Ok(MapDataResponse {
      elevations,
      animal_ids,
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
        log::warn!("GameServerInner::handle_mini_elevations_command: No game");
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
        log::warn!("GameServerInner::handle_read_animals_command: No game");
        return ReadAnimalsRsp::Failed(
          FailedResponse::new("No game to read animals from")
        );
      }
    };

    let animals = game.world().read_animals_entity_data();
    ReadAnimalsRsp::Ok(AnimalsResponse { animals })
  }

  fn handle_take_turn_step_command(&mut self,
    take_turn_step_cmd: TakeTurnStepCmd,
  ) -> TakeTurnStepRsp {

    // Validate command.
    let mut validation_errors = Vec::new();
    if !take_turn_step_cmd.validate(&mut validation_errors) {
      log::warn!("GameServerInner::take_turn_step: Invalid command: {:?}",
        validation_errors
      );
      return TakeTurnStepRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let mut game = match self.game {
      Some(ref mut game) => game,
      None => {
        log::warn!("GameServerInner::handle_take_turn_step_command: No game");
        return TakeTurnStepRsp::Failed(
          FailedResponse::new("No game to take turn step")
        );
      }
    };

    let TakeTurnStepResult { turn_no_after, elapsed_ms } =
      game.world_mut().take_turn_step();

    TakeTurnStepRsp::TurnTaken(
      TurnTakenResponse { turn_no_after, elapsed_ms }
    )
  }

  fn handle_get_cell_info_command(&mut self,
    get_cell_info_cmd: GetCellInfoCmd,
  ) -> GetCellInfoRsp {
    // Validate command.
    let mut validation_errors = Vec::new();
    if !get_cell_info_cmd.validate(&mut validation_errors) {
      log::warn!("GameServerInner::handle_get_cell_info_command: Invalid command: {:?}",
        validation_errors
      );
      return GetCellInfoRsp::Failed(FailedResponse::new_vec(validation_errors));
    }

    let game = match self.game {
      Some(ref game) => game,
      None => {
        log::warn!("GameServerInner::handle_get_cell_info_command: No game");
        return GetCellInfoRsp::Failed(
          FailedResponse::new("No game to get cell info from")
        );
      }
    };

    let cell_coord = get_cell_info_cmd.cell_coord;
    let world_dims = game.world().world_dims();
    if ! world_dims.contains_coord(cell_coord) {
      return GetCellInfoRsp::Failed(
        FailedResponse::new("Cell coord is out of bounds")
      );
    }

    let cell_info = game.world().read_cell_info(cell_coord);
    GetCellInfoRsp::CellInfo(cell_info)
  }
}
