
/**
 * A format is a layout of 32-bit words in memory, within which different
 * bitfields are used to store different numerical values.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatRules {
  // The format for each word.
  pub(crate) word_formats: Vec<FormatRulesWord>,
}


/**
 * The format of a single word.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatRulesWord {
  // The bitfields in the word.
  pub(crate) components: Vec<FormatRulesComponent>,
}

/**
 * A single component of a word.
 */
#[derive(Debug, Clone)]
#[derive(serde::Serialize, serde::Deserialize)]
pub(crate) struct FormatRulesComponent {
  // The name of the component.
  pub(crate) name: String,

  // The offset of the component in the word.
  pub(crate) offset: u8,

  // The number of bits in the component.
  pub(crate) bits: u8,
}
