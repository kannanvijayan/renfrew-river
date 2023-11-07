use serde;

use crate::world::{CellInfo, AnimalData};

use super::command::{
  GetConstantsRsp,
  DefaultSettingsRsp,
  GameExistsResponse,
  MapDataResponse,
  MiniElevationsResponse,
  AnimalsResponse,
  TurnTakenResponse,
};

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum ResponseEnvelope {
  Ok {},
  Error(Box<FailedResponse>),
  Constants(Box<GetConstantsRsp>),
  DefaultSettings(Box<DefaultSettingsRsp>),
  GameExists(Box<GameExistsResponse>),
  NoGameExists {},
  MapData(Box<MapDataResponse>),
  MiniElevations(Box<MiniElevationsResponse>),
  Animals(Box<AnimalsResponse>),
  TurnTaken(Box<TurnTakenResponse>),
  CellInfo(Box<CellInfo>),
  AnimalData(Box<AnimalData>),
}

#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FailedResponse {
  messages: Vec<String>,
}
impl FailedResponse {
  pub(crate) fn new<S: AsRef<str>>(message: S) -> FailedResponse {
    FailedResponse { messages: vec![message.as_ref().to_owned()] }
  }

  pub(crate) fn new_vec(messages: Vec<String>) -> FailedResponse {
    FailedResponse { messages }
  }
}
