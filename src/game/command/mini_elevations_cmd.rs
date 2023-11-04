use serde;
use crate::{
  game::{
    response::{ResponseEnvelope, FailedResponse},
    command::{Command, CommandEnvelope},
  },
  world::{ WorldDims, ElevationValueType },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct MiniElevationsCmd {
  pub(crate) mini_dims: WorldDims,
}
impl MiniElevationsCmd {
  const MINI_DIMS_COLUMNS_MULTIPLE: u16 = 4;
  const MINI_DIMS_ROWS_MULTIPLE: u16 = 4;
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum MiniElevationsRsp {
  Ok(MiniElevationsResponse),
  Failed(FailedResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct MiniElevationsResponse {
  pub(crate) elevations: Vec<Vec<ElevationValueType>>,
}

impl Command for MiniElevationsCmd {
  type Response = MiniElevationsRsp;
  fn name() -> &'static str {
    "MiniElevations"
  }
  fn description() -> &'static str {
    "Read mini-map elevations."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::MiniElevations(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::MiniElevations(read_elevations_response) =>
        Some(MiniElevationsRsp::Ok(*read_elevations_response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      MiniElevationsRsp::Ok(response) =>
        ResponseEnvelope::MiniElevations(Box::new(response)),
      MiniElevationsRsp::Failed(failure) =>
        ResponseEnvelope::Error(Box::new(failure)),
    }
  }
  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    let mut errored = false;
    if (self.mini_dims.columns % Self::MINI_DIMS_COLUMNS_MULTIPLE) != 0 {
      _errors.push(format!(
        "Area columns must be a multiple of {}",
        Self::MINI_DIMS_COLUMNS_MULTIPLE
      ));
      errored = true;
    }
    if (self.mini_dims.rows % Self::MINI_DIMS_ROWS_MULTIPLE) != 0 {
      _errors.push(format!(
        "Area rows must be a multiple of {}",
        Self::MINI_DIMS_ROWS_MULTIPLE
      ));
      errored = true;
    }
    !errored
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let read_elevations_example = MiniElevationsCmd {
      mini_dims: WorldDims::new(4, 4),
    };

    let elevations_rsp_example = MiniElevationsRsp::Ok(
      MiniElevationsResponse {
        elevations: vec![
          vec![1, 2, 3, 4],
          vec![2, 1, 9, 3],
          vec![6, 5, 1, 1],
          vec![7, 8, 2, 4],
        ]
      }
    );
    let failed_response_example = MiniElevationsRsp::Failed(
      FailedResponse::new("Failed to minify elevations")
    );
    (
      vec![read_elevations_example],
      vec![elevations_rsp_example, failed_response_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "The mini_dims width and height must both be a multiple of 4.".to_string(),
    ]
  }
}
