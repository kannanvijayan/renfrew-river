use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::define_rules::DefineRulesSubcmdResponse,
    response::ResponseEnvelope,
  },
  ruleset::{ Ruleset, TerrainGenRules },
};
use super::DefineRulesSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct LoadRulesCmd {
  #[serde(rename = "rulesetName")]
  pub(crate) ruleset_name: String,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum LoadRulesRsp {
  Loaded(Ruleset),
  Failed(Vec<String>),
}
impl Command for LoadRulesCmd {
  type Response = LoadRulesRsp;
  fn name() -> &'static str {
    "LoadRules"
  }
  fn description() -> &'static str {
    "Load the named ruleset."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::DefineRulesSubcmd(
      DefineRulesSubcmdEnvelope::LoadRules(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    let subcmd_response = match response {
      LoadRulesRsp::Loaded(ruleset) =>
        DefineRulesSubcmdResponse::LoadedRuleset(ruleset),
      LoadRulesRsp::Failed(messages) =>
        DefineRulesSubcmdResponse::Failed(messages)
    };
    ResponseEnvelope::DefineRulesSubcmd(subcmd_response)
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let load_rules_example = LoadRulesCmd {
      ruleset_name: "FreeCiv".to_string()
    };

    let load_rules_ok_response_example = LoadRulesRsp::Loaded(
      Ruleset {
        name: "FreeCiv".to_string(),
        description: "FreeCiv ruleset".to_string(),
        terrain_gen: TerrainGenRules::new_example(),
      }
    );
    let load_rules_err_response_example = LoadRulesRsp::Failed(vec![
      "No such ruleset.".to_string(),
    ]);
    (
      vec![load_rules_example],
      vec![
        load_rules_ok_response_example,
        load_rules_err_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
