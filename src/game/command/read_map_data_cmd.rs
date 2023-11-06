use serde;
use crate::{
  game::{
    response::{ResponseEnvelope, FailedResponse},
    command::{Command, CommandEnvelope},
  },
  world::{ CellCoord, WorldDims, ElevationValueType, AnimalId },
};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ReadMapDataKind {
  Elevation,
  AnimalId,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ReadMapDataCmd {
  pub(crate) top_left: CellCoord,
  pub(crate) area: WorldDims,
  pub(crate) kinds: Vec<ReadMapDataKind>,
}
impl ReadMapDataCmd {
  const TOP_LEFT_COL_MULTIPLE: u16 = 4;
  const TOP_LEFT_ROW_MULTIPLE: u16 = 4;
  const AREA_COLUMNS_MULTIPLE: u16 = 4;
  const AREA_ROWS_MULTIPLE: u16 = 4;
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ReadMapDataRsp {
  Ok(MapDataResponse),
  Failed(FailedResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct MapDataResponse {
  pub(crate) elevations: Option<Vec<Vec<ElevationValueType>>>,
  pub(crate) animal_ids: Option<Vec<Vec<AnimalId>>>,
}

impl Command for ReadMapDataCmd {
  type Response = ReadMapDataRsp;
  fn name() -> &'static str {
    "ReadMapData"
  }
  fn description() -> &'static str {
    "Read data from a segment of the map."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::ReadMapData(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::MapData(read_elevations_response) =>
        Some(ReadMapDataRsp::Ok(*read_elevations_response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      ReadMapDataRsp::Ok(response) =>
        ResponseEnvelope::MapData(Box::new(response)),
      ReadMapDataRsp::Failed(failure) =>
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
    let read_elevations_example = ReadMapDataCmd {
      top_left: CellCoord::new(40, 12),
      area: WorldDims::new(4, 4),
      kinds: vec![ReadMapDataKind::Elevation],
    };
    let read_elevations_animals_example = ReadMapDataCmd {
      top_left: CellCoord::new(8, 4),
      area: WorldDims::new(4, 4),
      kinds: vec![ReadMapDataKind::Elevation, ReadMapDataKind::AnimalId],
    };

    let elevations_rsp_example = ReadMapDataRsp::Ok(
      MapDataResponse {
        elevations: Some(vec![
          vec![1, 2, 3, 4],
          vec![2, 1, 9, 3],
          vec![6, 5, 1, 1],
          vec![7, 8, 2, 4],
        ]),
        animal_ids: None,
      }
    );

    let elevations_animals_rsp_example = ReadMapDataRsp::Ok(
      MapDataResponse {
        elevations: Some(vec![
          vec![1, 2, 3, 4],
          vec![2, 1, 9, 3],
          vec![6, 5, 1, 1],
          vec![7, 8, 2, 4],
        ]),
        animal_ids: Some(vec![
          vec![100, 29, 3, 404]
            .iter().copied().map(AnimalId::from_u32).collect(),
          vec![22, 1006, 95, 332]
            .iter().copied().map(AnimalId::from_u32).collect(),
          vec![65, 5, 152, 10091]
            .iter().copied().map(AnimalId::from_u32).collect(),
          vec![78, 88, 252, 491]
            .iter().copied().map(AnimalId::from_u32).collect(),
        ]),
      }
    );
    let failed_response_example = ReadMapDataRsp::Failed(
      FailedResponse::new("Failed to read elevations")
    );
    (
      vec![
        read_elevations_example,
        read_elevations_animals_example,
      ],
      vec![
        elevations_rsp_example,
        elevations_animals_rsp_example,
        failed_response_example,
      ],
    )
  }
  fn protocol_notes() -> Vec<String> {
    vec![
      "The top_left col and row must both be a multiple of 4.".to_string(),
      "The area width and height must both be a multiple of 4.".to_string(),
    ]
  }
}
