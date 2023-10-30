use serde;
use crate::{
  game::{
    response::{ResponseEnvelope, FailedResponse},
    command::{Command, CommandEnvelope},
  },
  world::{ CellCoord, WorldDims, TerrainElevationValueType },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ReadElevationsCmd {
  pub(crate) top_left: CellCoord,
  pub(crate) area: WorldDims,
}
impl ReadElevationsCmd {
  const TOP_LEFT_COL_MULTIPLE: u16 = 4;
  const TOP_LEFT_ROW_MULTIPLE: u16 = 4;
  const AREA_COLUMNS_MULTIPLE: u16 = 4;
  const AREA_ROWS_MULTIPLE: u16 = 4;
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ReadElevationsRsp {
  Ok(ElevationsResponse),
  Failed(FailedResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ElevationsResponse {
  pub(crate) elevations: Vec<Vec<TerrainElevationValueType>>,
}

impl Command for ReadElevationsCmd {
  type Response = ReadElevationsRsp;
  fn name() -> &'static str {
    "ReadElevations"
  }
  fn description() -> &'static str {
    "Read elevations from a segment of the map."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::ReadElevations(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Elevations(read_elevations_response) =>
        Some(ReadElevationsRsp::Ok(*read_elevations_response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      ReadElevationsRsp::Ok(response) =>
        ResponseEnvelope::Elevations(Box::new(response)),
      ReadElevationsRsp::Failed(failure) =>
        ResponseEnvelope::Error(Box::new(failure)),
    }
  }
  fn validate(&self, _errors: &mut Vec<String>) -> bool {
    let mut errored = false;
    if (self.top_left.col % Self::TOP_LEFT_COL_MULTIPLE) != 0 {
      _errors.push(format!(
        "Top left col must be a multiple of {}",
        Self::TOP_LEFT_COL_MULTIPLE
      ));
      errored = true;
    }
    if (self.top_left.row % Self::TOP_LEFT_ROW_MULTIPLE) != 0 {
      _errors.push(format!(
        "Top left row must be a multiple of {}",
        Self::TOP_LEFT_ROW_MULTIPLE
      ));
      errored = true;
    }
    if (self.area.columns % Self::AREA_COLUMNS_MULTIPLE) != 0 {
      _errors.push(format!(
        "Area columns must be a multiple of {}",
        Self::AREA_COLUMNS_MULTIPLE
      ));
      errored = true;
    }
    if (self.area.rows % Self::AREA_ROWS_MULTIPLE) != 0 {
      _errors.push(format!(
        "Area rows must be a multiple of {}",
        Self::AREA_ROWS_MULTIPLE
      ));
      errored = true;
    }
    !errored
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let read_elevations_example = ReadElevationsCmd {
      top_left: CellCoord::new(0, 0),
      area: WorldDims::new(4, 4),
    };

    let elevations_rsp_example = ReadElevationsRsp::Ok(
      ElevationsResponse {
        elevations: vec![
          vec![1, 2, 3, 4],
          vec![2, 1, 9, 3],
          vec![6, 5, 1, 1],
          vec![7, 8, 2, 4],
        ]
      }
    );
    let failed_response_example = ReadElevationsRsp::Failed(
      FailedResponse::new("Failed to read elevations")
    );
    (
      vec![read_elevations_example],
      vec![elevations_rsp_example, failed_response_example],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "The top_left col and row must both be a multiple of 4.".to_string(),
      "The area width and height must both be a multiple of 4.".to_string(),
    ]
  }
}