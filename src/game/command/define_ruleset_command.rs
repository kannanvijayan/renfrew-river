use serde;
use crate::{
  ruleset::{
    TerrainGenRules,
    TerrainGenPerlinRules,
    TerrainGenStageRules,
    Ruleset,
    FormatRules,
    FormatRulesWord,
    FormatRulesComponent,
  },
  game::{
    command::{ Command, CommandEnvelope },
    response::{ FailedResponse, ResponseEnvelope }
  },
  gpu::shady_vm::{ ShadyRegister, ShadyProgram, ShasmProgram },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct DefineRulesetCmd {
  pub(crate) ruleset: Ruleset,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum DefineRulesetRsp {
  Ok,
  Failed(Vec<String>),
}

impl Command for DefineRulesetCmd {
  type Response = DefineRulesetRsp;
  fn name() -> &'static str {
    "DefineRuleset"
  }
  fn description() -> &'static str {
    "Define the ruleset for a world."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::DefineRuleset(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Ok {} => Some(DefineRulesetRsp::Ok),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      DefineRulesetRsp::Ok => ResponseEnvelope::Ok {},
      DefineRulesetRsp::Failed(msgs) => ResponseEnvelope::Error(
        Box::new(FailedResponse::new_vec(msgs))
      ),
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let define_ruleset_example = define_ruleset_cmd_example();

    let response_example = DefineRulesetRsp::Ok;
    let response_example_2 = DefineRulesetRsp::Failed(
      vec!["World `RogueLove` already exists.".to_owned()]
    );
    let response_example_3 = DefineRulesetRsp::Failed(
      vec!["A different mode is currenty loaded.".to_owned()]
    );

    (
      vec![define_ruleset_example],
      vec![response_example, response_example_2, response_example_3],
    )
  }
}

pub(crate) fn define_ruleset_cmd_example() -> DefineRulesetCmd {
  DefineRulesetCmd {
    ruleset: Ruleset {
      name: "RogueLove".to_string(),
      description: "A world of love and adventure.".to_string(),
      terrain_gen:  TerrainGenRules {
        perlin: TerrainGenPerlinRules {
          seed: 1,
          octaves: 5,
          frequency: 9,
          amplitude: 3,
          register: ShadyRegister::new(4),
        },
        stage: TerrainGenStageRules {
          format: FormatRules  {
            word_formats: vec![
              FormatRulesWord {
                components: vec![
                  FormatRulesComponent {
                    name: "word0_field_0".to_string(),
                    offset: 0,
                    bits: 9,
                  },
                  FormatRulesComponent {
                    name: "word0_field_1".to_string(),
                    offset: 9,
                    bits: 3,
                  }
                ]
              }
            ]
          },
          init_program: ShasmProgram::new("add r0, r1, r2".to_string()),
          iterations: 1,
          pairwise_program: ShasmProgram::new("add r0, r1, r2".to_string()),
          pairwise_output_registers: 1,
          merge_program: ShasmProgram::new("add r0, r1, r2".to_string()),
          final_program: ShasmProgram::new("add r0, r1, r2".to_string()),
        },
      },
    },
  }
}
