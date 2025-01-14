
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) enum CreateWorldSubcmdResponse {
  Failed(Vec<String>)
}
