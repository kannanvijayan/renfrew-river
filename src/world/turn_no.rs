use serde;

/** Represents a turn number. */
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct TurnNo(pub(crate) u64);
impl TurnNo {
  pub(crate) fn next(&self) -> TurnNo {
    TurnNo(self.0 + 1)
  }
}
