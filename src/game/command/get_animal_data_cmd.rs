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
    AnimalData,
  },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct GetAnimalDataCmd {
  pub(crate) animal_id: AnimalId,
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum GetAnimalDataRsp {
  AnimalData(AnimalData),
  Failed(FailedResponse),
}

impl Command for GetAnimalDataCmd {
  type Response = GetAnimalDataRsp;
  fn name() -> &'static str {
    "GetAnimalData"
  }
  fn description() -> &'static str {
    "Read all the information about a given animal."
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::GetAnimalData(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::AnimalData(animal_data_response) =>
        Some(GetAnimalDataRsp::AnimalData(*animal_data_response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      GetAnimalDataRsp::AnimalData(response) =>
        ResponseEnvelope::AnimalData(Box::new(response)),
      GetAnimalDataRsp::Failed(failure) =>
        ResponseEnvelope::Error(Box::new(failure)),
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let get_animal_data_example = GetAnimalDataCmd {
      animal_id: AnimalId::from_u32(133),
    };

    let animal_data_rsp_example = GetAnimalDataRsp::AnimalData(
      AnimalData {
        position: CellCoord { col: 19, row: 22 }
      }
    );

    let failed_response_example = GetAnimalDataRsp::Failed(
      FailedResponse::new("Invalid animal id.")
    );
    (
      vec![
        get_animal_data_example,
      ],
      vec![
        animal_data_rsp_example,
        failed_response_example,
      ],
    )
  }
}
