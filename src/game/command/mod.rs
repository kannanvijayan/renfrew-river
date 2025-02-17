
// Specific commands
mod get_constants_cmd;
mod default_settings_cmd;
mod has_game_cmd;
mod new_game_cmd;
mod stop_game_cmd;
mod read_map_data_cmd;
mod mini_elevations_cmd;
mod read_animals_cmd;
mod take_turn_step_cmd;
mod get_cell_info_cmd;
mod get_animal_data_cmd;
mod snapshot_game_cmd;
mod restore_game_cmd;
mod define_ruleset_command;
mod validate_shasm_cmd;

mod envelope;

use serde;
use crate::game::response::ResponseEnvelope;

pub(crate) use self::{
  get_constants_cmd::{
    GetConstantsCmd,
    GetConstantsRsp,
  },
  default_settings_cmd::{
    DefaultSettingsCmd,
    DefaultSettingsRsp,
  },
  has_game_cmd::{
    HasGameCmd,
    HasGameRsp,
    GameExistsResponse,
  },
  new_game_cmd::{
    NewGameCmd,
    NewGameRsp,
  },
  stop_game_cmd::{
    StopGameCmd,
    StopGameRsp,
  },
  read_map_data_cmd::{
    ReadMapDataCmd,
    ReadMapDataKind,
    ReadMapDataRsp,
    MapDataResponse,
  },
  mini_elevations_cmd::{
    MiniElevationsCmd,
    MiniElevationsRsp,
    MiniElevationsResponse,
  },
  read_animals_cmd::{
    ReadAnimalsCmd,
    ReadAnimalsRsp,
    AnimalsResponse,
  },
  take_turn_step_cmd::{
    TakeTurnStepCmd,
    TakeTurnStepRsp,
    TurnTakenResponse,
  },
  get_cell_info_cmd::{
    GetCellInfoCmd,
    GetCellInfoRsp,
  },
  get_animal_data_cmd::{
    GetAnimalDataCmd,
    GetAnimalDataRsp,
  },
  snapshot_game_cmd::{
    SnapshotGameCmd,
    SnapshotGameRsp,
    GameSnapshotResponse,
  },
  restore_game_cmd::{
    RestoreGameCmd,
    RestoreGameRsp,
  },
  validate_shasm_cmd::{
    ValidateShasmCmd,
    ValidateShasmRsp,
    InvalidShasmResponse,
  },
  define_ruleset_command::{
    DefineRulesetCmd,
    DefineRulesetRsp,
  },
  envelope::CommandEnvelope,
};

use super::ProtocolCommandDocumentation;

/** Base trait implemented by all commands. */
pub(crate) trait Command:
  Sized +
  serde::Serialize +
  serde::de::DeserializeOwned +
  std::fmt::Debug
{
  type Response: for <'x> serde::Deserialize<'x> + serde::Serialize;
  fn name() -> &'static str;
  fn description() -> &'static str;
  fn to_queue_command(&self) -> CommandEnvelope;
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response>;
  fn embed_response(response: Self::Response) -> ResponseEnvelope;
  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    true
  }

  // Get a list of examples of commands and responses, as json values.
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>);
  fn protocol_notes() -> Vec<String> {
    Vec::new()
  }
}

pub(crate) fn make_command_example<C: Command>()
  -> ProtocolCommandDocumentation
{
  let (commands, responses) = C::protocol_examples();
  let notes = C::protocol_notes();
  let command_examples: Vec<String> = commands.into_iter().map(|command| {
    serde_json::to_string_pretty(&command.to_queue_command()).unwrap()
  }).collect();
  let response_examples: Vec<String> = responses.into_iter().map(|response| {
    serde_json::to_string_pretty(&C::embed_response(response)).unwrap()
  }).collect();
  return ProtocolCommandDocumentation {
    name: C::name().to_string(),
    description: C::description().to_string(),
    notes,
    command_examples,
    response_examples,
  }
}
