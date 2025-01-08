use std::collections::HashMap;
use serde::{ Serialize, Deserialize };

/**
 * Extra flags that can be passed to the game.
 */
#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize)]
pub(crate) struct ExtraFlags {
  flags_map: HashMap<String, ExtraFlagsValue>,
}
impl ExtraFlags {
  pub(crate) fn new() -> Self {
    Self {
      flags_map: HashMap::new(),
    }
  }
  pub(crate) fn from_str(string: Option<&str>) -> Self {
    let mut flags = Self::new();
    if let Some(string) = string {
      flags.parse_str(string);
    }
    flags
  }
  pub(crate) fn parse_str(&mut self, string: &str) {
    for flag in string.split(',') {
      let mut flag_parts = flag.split('=');
      let flag_name = match flag_parts.next() {
        Some(name) => name.to_string(),
        None => continue,
      };
      let flag_value = match flag_parts.next() {
        Some(value) => value,
        None => {
          self.flags_map.insert(flag_name, ExtraFlagsValue::Bool(true));
          continue;
        }
      };
      if let Ok(i32_value) = flag_value.parse::<i32>() {
        self.flags_map.insert(flag_name, ExtraFlagsValue::Int32(i32_value));
        continue;
      }
      if let Ok(bool_value) = flag_value.parse::<bool>() {
        self.flags_map.insert(flag_name, ExtraFlagsValue::Bool(bool_value));
        continue;
      }
      self.flags_map.insert(
        flag_name,
        ExtraFlagsValue::String(flag_value.to_string())
      );
    }
  }

  pub(crate) fn get_i32(&self, name: &str) -> Option<i32> {
    match self.flags_map.get(name) {
      Some(ExtraFlagsValue::Int32(value)) => Some(*value),
      _ => None,
    }
  }
  pub(crate) fn get_bool(&self, name: &str) -> Option<bool> {
    match self.flags_map.get(name) {
      Some(ExtraFlagsValue::Bool(value)) => Some(*value),
      _ => None,
    }
  }
  pub(crate) fn get_string(&self, name: &str) -> Option<&str> {
    match self.flags_map.get(name) {
      Some(ExtraFlagsValue::String(ref value)) => Some(value),
      _ => None,
    }
  }
}

#[derive(Clone, Debug)]
#[derive(Serialize, Deserialize)]
pub(crate) enum ExtraFlagsValue {
  Bool(bool),
  String(String),
  Int32(i32),
}
