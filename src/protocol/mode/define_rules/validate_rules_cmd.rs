use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::define_rules::response::DefineRulesSubcmdResponse,
    response::ResponseEnvelope,
  },
  shady_vm::{ShasmParseError, ShasmProgramValidation},
  ruleset::{
    FormatComponentInput,
    FormatComponentValidation,
    FormatInput,
    FormatValidation,
    FormatWordInput,
    FormatWordValidation,
    RulesetInput,
    RulesetValidation,
    TerrainGenInput,
    TerrainGenPerlinInput,
    TerrainGenPerlinValidation,
    TerrainGenStageInput,
    TerrainGenStageValidation,
    TerrainGenValidation,
  },
};
use super::DefineRulesSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ValidateRulesCmd {
  #[serde(rename = "rulesetInput")]
  pub(crate) ruleset_input: RulesetInput,
}
impl ValidateRulesCmd {
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ValidateRulesRsp {
  #[serde(rename = "isValid")]
  pub(crate) is_valid: bool,

  #[serde(skip_serializing_if = "RulesetValidation::is_valid")]
  pub(crate) validation: RulesetValidation,
}
impl Command for ValidateRulesCmd {
  type Response = ValidateRulesRsp;
  fn name() -> &'static str {
    "ValidateRules"
  }
  fn description() -> &'static str {
    "Validate the given ruleset."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::DefineRulesSubcmd(
      DefineRulesSubcmdEnvelope::ValidateRules(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::DefineRulesSubcmd(
      DefineRulesSubcmdResponse::Validation(response)
    )
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let validate_example = ValidateRulesCmd {
      ruleset_input: RulesetInput {
        name: "Example Ruleset".to_string(),
        description: "Example ruleset description".to_string(),
        terrain_gen: TerrainGenInput {
          stage: TerrainGenStageInput {
            format: FormatInput {
              word_formats: vec![
                FormatWordInput {
                  name: "word_0".to_string(),
                  components: vec![
                    FormatComponentInput {
                      name: "component_0".to_string(),
                      offset: "".to_string(),
                      bits: "-99".to_string(),
                    },
                    FormatComponentInput {
                      name: "component_1".to_string(),
                      offset: "foobar".to_string(),
                      bits: "33".to_string(),
                    },
                  ]
                }
              ],
            },
            init_program: "mov r0, r1, r2\nadd r1, r3, 33\n".to_string(),
            pairwise_program: "add r0, r1, 33\n".to_string(),
            merge_program: "add r0, r1, 33\n".to_string(),
            final_program: "add r0, r1, 33\n".to_string(),
          },
          perlin: TerrainGenPerlinInput {
            register: "4".to_string(),
          }
        }
      }
    };

    let validate_ok_response_example = ValidateRulesRsp {
      is_valid: true,
      validation: RulesetValidation {
        errors: vec![],
        name: vec![],
        description: vec![],
        terrain_gen: None,
      },
    };
    let validate_failed_response_example = ValidateRulesRsp {
      is_valid: false,
      validation: RulesetValidation { 
        errors: vec![
          "error_1".to_string(),
          "error_2".to_string(),
        ],
        name: vec![
          "error_1a".to_string(),
          "error_2a".to_string(),
        ],
        description: vec![
          "error_1b".to_string(),
          "error_2b".to_string(),
        ],
        terrain_gen: Some(TerrainGenValidation {
          errors: vec![
            "error_3".to_string(),
            "error_4".to_string(),
          ],
          stage: Some(TerrainGenStageValidation {
            errors: vec![
              "error_5".to_string(),
              "error_6".to_string(),
            ],
            format: Some(FormatValidation {
              errors: vec![
                "error_7".to_string(),
                "error_8".to_string(),
              ],
              word_formats: vec![
                FormatWordValidation {
                  errors: vec![
                    "error_9".to_string(),
                    "error_10".to_string(),
                  ],
                  components: vec![
                    FormatComponentValidation {
                      errors: vec![
                        "error_11".to_string(),
                        "error_12".to_string(),
                      ],
                      name: vec![],
                      offset: vec![],
                      bits: vec![],
                    },
                    FormatComponentValidation {
                      errors: vec![
                        "error_13".to_string(),
                        "error_14".to_string(),
                      ],
                      name: vec![],
                      offset: vec!["error_15".to_string()],
                      bits: vec![],
                    }
                  ],
                }
              ],
            }),
            init_program: Some(ShasmProgramValidation {
              errors: vec![
                ShasmParseError {
                  line_no: 1,
                  message: "error_16".to_string(),
                }
              ],
            }),
            pairwise_program: Some(ShasmProgramValidation {
              errors: vec![
                ShasmParseError {
                  line_no: 3,
                  message: "error_18".to_string(),
                }
              ],
            }),
            merge_program: Some(ShasmProgramValidation {
              errors: vec![
                ShasmParseError {
                  line_no: 5,
                  message: "error_20".to_string(),
                }
              ],
            }),
            final_program: Some(ShasmProgramValidation {
              errors: vec![
                ShasmParseError {
                  line_no: 7,
                  message: "error_21".to_string(),
                }
              ],
            }),
          }),
          perlin: Some(TerrainGenPerlinValidation {
            errors: vec![
              "error_15".to_string(),
              "error_16".to_string(),
            ],
            seed: vec!["error_17".to_string()],
            octaves: vec!["error_18".to_string()],
            frequency: vec!["error_19".to_string()],
            amplitude: vec!["error_20".to_string()],
            register: vec!["error_21".to_string()],
          }),
        })
      }
    };
    (
      vec![validate_example],
      vec![
        validate_ok_response_example,
        validate_failed_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
    ]
  }
}
