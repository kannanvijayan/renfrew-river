use serde;
use crate::game::command::{
  GetConstantsCmd,
  DefaultSettingsCmd,
  HasGameCmd,
  NewGameCmd,
  StopGameCmd,
  ReadMapDataCmd,
  MiniElevationsCmd,
  ReadAnimalsCmd,
  TakeTurnStepCmd,
};

/** Tagged union type for commands sent over transport channels. */
#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CommandEnvelope {
  GetConstants(Box<GetConstantsCmd>),
  DefaultSettings(Box<DefaultSettingsCmd>),
  HasGame(Box<HasGameCmd>),
  NewGame(Box<NewGameCmd>),
  StopGame(Box<StopGameCmd>),
  ReadMapData(Box<ReadMapDataCmd>),
  MiniElevations(Box<MiniElevationsCmd>),
  ReadAnimals(Box<ReadAnimalsCmd>),
  TakeTurnStep(Box<TakeTurnStepCmd>),
}
