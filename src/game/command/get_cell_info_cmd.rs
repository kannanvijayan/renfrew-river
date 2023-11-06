use serde;
use crate::{
  game::{
    response::{ResponseEnvelope, FailedResponse},
    command::{Command, CommandEnvelope},
  },
  world::{
    CellCoord,
    AnimalId,
    Elevation,
    CellInfo,
  },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetCellInfoCmd {
  pub(crate) cell_coord: CellCoord,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GetCellInfoRsp {
  CellInfo(CellInfo),
  Failed(FailedResponse),
}

impl Command for GetCellInfoCmd {
  type Response = GetCellInfoRsp;
  fn name() -> &'static str {
    "GetCellInfo"
  }
  fn description() -> &'static str {
    "Read all the information about a given map cell."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::GetCellInfo(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::CellInfo(cell_info_response) =>
        Some(GetCellInfoRsp::CellInfo(*cell_info_response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      GetCellInfoRsp::CellInfo(response) =>
        ResponseEnvelope::CellInfo(Box::new(response)),
      GetCellInfoRsp::Failed(failure) =>
        ResponseEnvelope::Error(Box::new(failure)),
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let get_cell_info_example = GetCellInfoCmd {
      cell_coord: CellCoord::new(40, 12),
    };

    let cell_info_rsp_example = GetCellInfoRsp::CellInfo(
      CellInfo {
        elevation: Elevation::from_value(0xf9),
        animal_id: Some(AnimalId::from_u32(551)),
      }
    );
    let cell_info_rsp_example_2 = GetCellInfoRsp::CellInfo(
      CellInfo {
        elevation: Elevation::from_value(0xf9),
        animal_id: None,
      }
    );

    let failed_response_example = GetCellInfoRsp::Failed(
      FailedResponse::new("Cell coord out of bounds.")
    );
    (
      vec![
        get_cell_info_example,
      ],
      vec![
        cell_info_rsp_example,
        cell_info_rsp_example_2,
        failed_response_example,
      ],
    )
  }
}
