use serde;
use crate::{
  game::{
    response::{ ResponseEnvelope, FailedResponse },
    command::{ Command, CommandEnvelope },
  },
  world::{ CellCoord, AnimalData },
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct ReadAnimalsCmd {
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ReadAnimalsRsp {
  Ok(AnimalsResponse),
  Failed(FailedResponse),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct AnimalsResponse {
  pub(crate) animals: Vec<AnimalData>,
}

impl Command for ReadAnimalsCmd {
  type Response = ReadAnimalsRsp;
  fn name() -> &'static str {
    "ReadAnimals"
  }
  fn description() -> &'static str {
    "Read animal data from the game"
  }
  fn to_queue_command(&self) -> CommandEnvelope {
    CommandEnvelope::ReadAnimals(Box::new(self.clone()))
  }
  fn extract_response(response: &ResponseEnvelope) -> Option<Self::Response> {
    match response {
      ResponseEnvelope::Animals(read_animals_response) =>
        Some(ReadAnimalsRsp::Ok(*read_animals_response.clone())),
      _ => None,
    }
  }
  fn embed_response(response: Self::Response) -> ResponseEnvelope {
    match response {
      ReadAnimalsRsp::Ok(response) =>
        ResponseEnvelope::Animals(Box::new(response)),
      ReadAnimalsRsp::Failed(failure) =>
        ResponseEnvelope::Error(Box::new(failure)),
    }
  }
  fn protocol_examples() -> (Vec<Self>, Vec<Self::Response>) {
    let read_animals_example = ReadAnimalsCmd {};

    let animals_rsp_example = ReadAnimalsRsp::Ok(
      AnimalsResponse {
        animals: vec![
          AnimalData {
            position: CellCoord { col: 9, row: 5 },
          },
          AnimalData {
            position: CellCoord { col: 33, row: 2 },
          },
          AnimalData {
            position: CellCoord { col: 1, row: 200 },
          },
        ]
      }
    );
    (
      vec![read_animals_example],
      vec![animals_rsp_example],
    )
  }
}
