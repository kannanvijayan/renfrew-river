use serde;
use crate::game::{
  command::{
    GetConstantsCmd,
    DefaultSettingsCmd,
    HasGameCmd,
    NewGameCmd,
    StopGameCmd,
    ReadMapDataCmd,
    MiniElevationsCmd,
    ReadAnimalsCmd,
    TakeTurnStepCmd,
    GetCellInfoCmd,
    GetAnimalDataCmd,
    SnapshotGameCmd,
    RestoreGameCmd,
    DefineRulesetCmd,
    ValidateShasmCmd,
  },
  mode::create_world::command::CreateWorldSubcmdEnvelope,
  mode::define_rules::command::DefineRulesSubcmdEnvelope,
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
  GetCellInfo(Box<GetCellInfoCmd>),
  GetAnimalData(Box<GetAnimalDataCmd>),
  SnapshotGame(Box<SnapshotGameCmd>),
  RestoreGame(Box<RestoreGameCmd>),
  ValidateShasm(Box<ValidateShasmCmd>),
  DefineRuleset(Box<DefineRulesetCmd>),
  CreateWorldSubcmd(Box<CreateWorldSubcmdEnvelope>),
  DefineRulesSubcmd(Box<DefineRulesSubcmdEnvelope>),
}
