use std::{
  path::PathBuf, sync::mpsc, thread::JoinHandle
};
use log;
use crate::{
  data_store::DataStore,
  game::mode::{ DefineRulesMode, GameMode },
  protocol::{
    mode::{
      define_rules::{
        DefineRulesModeInfo,
        DefineRulesSubcmdEnvelope,
        DefineRulesSubcmdResponse,
      },
      GameModeInfo,
    },
    CommandEnvelope,
    EnterMainMenuModeCmd,
    EnterModeCmd,
    FailedResponse,
    GetModeInfoCmd,
    ListRulesetsCmd,
    ResponseEnvelope,
  },
};
use super::GameServerConfig;

/**
 * A server that fronts the game engine running on another thread.
 * Provides a rust API for interacting with the game, and a generic
 * `perform_command` method for usage by the network server.
 */
pub(crate) struct GameServer {
  // The join-handle for the game thread.
  _join_handle: Option<JoinHandle<()>>,

  // A mpsc channel for sending messages to the game thread.
  command_tx: mpsc::Sender<CommandEnvelope>,

  // An mpsc channel for receving responses and events from the game thread.
  response_rx: mpsc::Receiver<ResponseEnvelope>,
}
impl GameServer {
  pub(crate) fn new(config: &GameServerConfig) -> GameServer {
    GameServerInner::start_thread(config)
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
  mode: Option<GameMode>,
  data_store: DataStore,
  stop: bool,
}
impl GameServerInner {
  pub(crate) fn start_thread(config: &GameServerConfig) -> GameServer {

    let (command_tx, command_rx) = mpsc::channel::<CommandEnvelope>();
    let (response_tx, response_rx) = mpsc::channel::<ResponseEnvelope>();

    let path: PathBuf = config.data_root.clone().try_into().expect(
      format!("Failed to convert data_root to PathBuf: {}", &config.data_root).as_str()
    );
    let data_store = DataStore::new(&path);
    let join_handle = std::thread::spawn(move || {
      let mut inner = GameServerInner {
        command_rx,
        response_tx,
        mode: None,
        data_store,
        stop: false,
      };
      inner.run();
    });

    GameServer {
      _join_handle: Some(join_handle),
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
      CommandEnvelope::EnterMode(enter_mode_cmd) => {
        let response = self.handle_enter_mode_cmd(enter_mode_cmd);
        return response;
      },
      CommandEnvelope::EnterMainMenuMode(enter_main_menu_mode_cmd) => {
        let response = self.handle_enter_main_menu_mode_cmd(enter_main_menu_mode_cmd);
        return response;
      },
      CommandEnvelope::GetModeInfo(get_mode_info_cmd) => {
        let response = self.handle_get_mode_info_cmd(get_mode_info_cmd);
        return response;
      },
      CommandEnvelope::ListRulesets(list_rulesets_cmd) => {
        let response = self.handle_list_rulesets_cmd(list_rulesets_cmd);
        return response;
      },
      CommandEnvelope::DefineRulesSubcmd(define_rules_subcmd) => {
        let envelope = self.handle_define_rules_subcmd(define_rules_subcmd);
        return ResponseEnvelope::DefineRulesSubcmd(envelope);
      },
    };
  }

  fn handle_enter_mode_cmd(&mut self, enter_mode_cmd: EnterModeCmd)
    -> ResponseEnvelope
  {
    log::debug!("GameServerInner::handle_enter_mode_cmd");

    let mode = enter_mode_cmd.mode;
    match mode {
      GameModeInfo::DefineRules(_) => {
        if ! self.mode.is_none() {
          log::warn!(
            "GameServerInner::handle_enter_mode_cmd: Already in a mode"
          );
          return ResponseEnvelope::Failed(FailedResponse::new(
            "Cannot enter mode: already in a mode".to_string()
          ));
        }
        self.mode = Some(GameMode::DefineRules(DefineRulesMode::new()));
        ResponseEnvelope::Ok {}
      },
    }
  }

  fn handle_enter_main_menu_mode_cmd(&mut self,
    _enter_main_menu_mode_cmd: EnterMainMenuModeCmd
  ) -> ResponseEnvelope {
    log::debug!("GameServerInner::handle_enter_main_menu_mode_cmd");
    self.mode = None;
    ResponseEnvelope::Ok {}
  }

  fn handle_get_mode_info_cmd(&self, _get_mode_info_cmd: GetModeInfoCmd)
    -> ResponseEnvelope
  {
    log::debug!("GameServerInner::handle_get_mode_info_cmd");
    match &self.mode {
      Some(GameMode::DefineRules(_)) =>
        ResponseEnvelope::InMode(
          GameModeInfo::DefineRules(DefineRulesModeInfo {})
        ),
      None => ResponseEnvelope::InMainMenuMode {},
    }
  }

  fn handle_list_rulesets_cmd(&mut self, _list_rulesets_cmd: ListRulesetsCmd)
    -> ResponseEnvelope
  {
    log::debug!("GameServerInner::handle_list_rulesets_cmd");
    let rulesets = self.data_store.rulesets().list().into_iter().map(
      |rs| rs.into_ruleset_entry()
    ).collect::<Vec<_>>();
    ResponseEnvelope::RulesetList(rulesets)
  }

  fn handle_define_rules_subcmd(&mut self, subcmd: DefineRulesSubcmdEnvelope)
    -> DefineRulesSubcmdResponse
  {
    log::debug!("GameServerInner::handle_define_rules_subcommand");
    if let Some(GameMode::DefineRules(ref mut define_rules_mode)) = self.mode {
      define_rules_mode.handle_subcommand(subcmd, &mut self.data_store)
    } else {
      log::warn!("GameServerInner::handle_define_rules_subcommand: Bad game mode");
      DefineRulesSubcmdResponse::Failed(
        vec!["No game mode to define rules".to_string()]
      )
    }
  }
}
