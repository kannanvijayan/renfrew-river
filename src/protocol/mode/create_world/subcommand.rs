use super::begin_new_world_cmd::BeginNewWorldCmd;

#[derive(Debug)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdEnvelope {
  BeginNewWorld(BeginNewWorldCmd),
}
