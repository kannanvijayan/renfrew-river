use serde;
use crate::ruleset::RulesetEntry;

use super::{
  command::{ Command, CommandEnvelope },
  response::ResponseEnvelope,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ListRulesetsCmd {}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ListRulesetsRsp {
  entries: Vec<RulesetEntry>,
}

impl Command for ListRulesetsCmd {
  type Response = ListRulesetsRsp;
  fn name() -> &'static str {
    "ListRulesets"
  }
  fn description() -> &'static str {
    "List all saved rulesets."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::ListRulesets(self.clone())
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::RulesetList(response.entries)
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let list_rulesets_example = ListRulesetsCmd {};

    let rulesets_response = ListRulesetsRsp {
      entries: vec![
        RulesetEntry {
          name: "Example Ruleset".to_string(),
          description: "Example ruleset description".to_string(),
        },
        RulesetEntry {
          name: "Another Ruleset".to_string(),
          description: "Another ruleset description".to_string(),
        },
      ]
    };

    (
      vec![list_rulesets_example],
      vec![rulesets_response]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
