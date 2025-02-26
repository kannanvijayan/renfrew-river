use serde;
use super::{
  command::{ Command, CommandEnvelope },
  mode::{
    define_rules::DefineRulesModeInfo,
    GameModeInfo,
  },
  response::ResponseEnvelope,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetModeInfoCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ModeInfoRsp {
  ModeInfo(GameModeInfo),
  MainMenu
}

impl Command for GetModeInfoCmd {
  type Response = ModeInfoRsp;
  fn name() -> &'static str {
    "GetModeInfo"
  }
  fn description() -> &'static str {
    "Get the current mode info."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::GetModeInfo(GetModeInfoCmd {})
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::InMode(mode_info) =>
        Some(ModeInfoRsp::ModeInfo(mode_info.clone())),
      ResponseEnvelope::InMainMenuMode {} =>
        Some(ModeInfoRsp::MainMenu),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      ModeInfoRsp::ModeInfo(mode_info) =>
        ResponseEnvelope::InMode(mode_info),
      ModeInfoRsp::MainMenu =>
        ResponseEnvelope::InMainMenuMode {},
    }
  }

  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    true
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let get_mode_info_example = GetModeInfoCmd {};

    let mode_info_response_1 = ModeInfoRsp::ModeInfo(
      GameModeInfo::DefineRules(DefineRulesModeInfo {})
    );
    let mode_info_response_2 = ModeInfoRsp::MainMenu;

    (
      vec![get_mode_info_example],
      vec![
        mode_info_response_1,
        mode_info_response_2,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
