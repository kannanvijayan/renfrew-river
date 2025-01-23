use serde;
use crate::{
  game::{
    response::ResponseEnvelope,
    command::{Command, CommandEnvelope},
  },
  gpu::shady_vm::ShasmParseError,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ValidateShasmCmd {
  #[serde(rename = "programText")]
  pub(crate) program_text: String,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ValidateShasmRsp {
  Valid,
  Invalid(InvalidShasmResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct InvalidShasmResponse {
  errors: Vec<ShasmParseError>,
}
impl InvalidShasmResponse {
  pub(crate) fn new(errors: Vec<ShasmParseError>) -> InvalidShasmResponse {
    InvalidShasmResponse { errors }
  }
}

impl Command for ValidateShasmCmd {
  type Response = ValidateShasmRsp;
  fn name() -> &'static str {
    "ValidateShasm"
  }
  fn description() -> &'static str {
    "Validate a Shasm program for use in the game."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::ValidateShasm(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Ok{} => Some(ValidateShasmRsp::Valid),
      ResponseEnvelope::InvalidShasm(invalid_shasm) =>
        Some(ValidateShasmRsp::Invalid(invalid_shasm.as_ref().clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      ValidateShasmRsp::Valid => ResponseEnvelope::Ok {},
      ValidateShasmRsp::Invalid(errors) =>
        ResponseEnvelope::InvalidShasm(Box::new(errors))
    }
  }

  fn validate(&self, errors: &mut Vec<String>) -> bool {
    // The command itself validates.
    // This just checks that the program text is not empty.
    if self.program_text.is_empty() {
      errors.push("Program text must not be empty".to_string());
      return false;
    }

    true
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let validate_shasm_example = ValidateShasmCmd {
      program_text: "add r0, r1, r2;\n@foo:\ngoto foo\n".to_string(),
    };

    let validate_shasm_ok_response_example = ValidateShasmRsp::Valid;
    let validate_shasm_failed_response_example = ValidateShasmRsp::Invalid(
      InvalidShasmResponse {
        errors: vec![
          ShasmParseError::new(1, "Error parsing instruction".to_string())
        ]
      }
    );
    (
      vec![validate_shasm_example],
      vec![
        validate_shasm_ok_response_example,
        validate_shasm_failed_response_example,
      ]
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![]
  }
}
