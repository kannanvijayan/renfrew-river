use serde;
use crate::{
  protocol::{
    command::{ Command, CommandEnvelope },
    mode::create_world::CreateWorldSubcmdResponse,
    response::ResponseEnvelope
  },
  world::{
    CellComponentSelector,
    CellCoord,
    GenerationCellDatumId,
    WorldDims,
  },
};
use super::CreateWorldSubcmdEnvelope;

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetMinimapDataCmd {
  #[serde(rename = "miniDims")]
  pub(crate) mini_dims: WorldDims,

  #[serde(rename = "datumId")]
  pub(crate) datum_id: GenerationCellDatumId,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetMinimapDataRsp {
  #[serde(rename = "miniDims")]
  pub(crate) mini_dims: WorldDims,

  pub(crate) data: Vec<u32>,
}
impl Command for GetMinimapDataCmd {
  type Response = GetMinimapDataRsp;
  fn name() -> &'static str {
    "GetMinimapData"
  }
  fn description() -> &'static str {
    "Retrieve generation minimap data by datum id."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdEnvelope::GetMinimapData(self.clone())
    )
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    ResponseEnvelope::CreateWorldSubcmd(
      CreateWorldSubcmdResponse::MinimapData(response)
    )
  }

  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let get_minimap_data_example = GetMinimapDataCmd {
      mini_dims: WorldDims::new(3, 3),
      datum_id: GenerationCellDatumId::Selector(CellComponentSelector {
        word: "word0".to_string(),
        component: "elevation".to_string(),
      }),
    };

    let get_minimap_data_ok_response = GetMinimapDataRsp {
      mini_dims: WorldDims::new(3, 3),
      data: vec![900, 905, 900, 893, 900, 895, 890, 899, 888],
    };

    (vec![get_minimap_data_example], vec![get_minimap_data_ok_response])
  }

  fn protocol_notes() -> Vec<String> {
    vec![]
  }
}
