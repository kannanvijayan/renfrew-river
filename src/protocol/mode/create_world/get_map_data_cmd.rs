use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope
  },
  data::{
    map::{ CellComponentSelector, CellCoord, WorldDims },
    GenerationCellDatumId,
  },
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetMapDataCmd {
  #[serde(rename = "topLeft")]
  pub(crate) top_left: CellCoord,
  pub(crate) dims: WorldDims,

  #[serde(rename = "datumIds")]
  pub(crate) datum_ids: Vec<GenerationCellDatumId>,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetMapDataRsp {
  #[serde(rename = "topLeft")]
  pub(crate) top_left: CellCoord,
  pub(crate) dims: WorldDims,
  pub(crate) data: Vec<Vec<u32>>,
}
impl Command for GetMapDataCmd {
  type Response = GetMapDataRsp;
  fn name() -> &'static str {
    "GetMapData"
  }
  fn description() -> &'static str {
    "Retrieve generation map data by id."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::GetMapData(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdResponse::MapData(response)
    )
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let get_map_data_example = GetMapDataCmd {
      top_left: CellCoord::new(198, 44),
      dims: WorldDims::new(10, 10),
      datum_ids: vec![
        GenerationCellDatumId::RandGen {},
        GenerationCellDatumId::Selector(CellComponentSelector {
          word: "word0".to_string(),
          component: "elevation".to_string(),
        }),
        GenerationCellDatumId::Selector(CellComponentSelector {
          word: "word2".to_string(),
          component: "temperature".to_string(),
        })
      ],
    };

    let get_map_data_ok_response = GetMapDataRsp {
      top_left: CellCoord::new(198, 44),
      dims: WorldDims::new(3, 3),
      data: vec![
        vec![900, 905, 900, 893, 900, 895, 890, 899, 888],
        vec![50, 51, 50, 53, 55, 52, 51, 52, 52],
      ]
    };

    (vec![get_map_data_example], vec![get_map_data_ok_response])
  }

  fn protocol_notes() -> Vec<String> {
    vec![]
  }
}
