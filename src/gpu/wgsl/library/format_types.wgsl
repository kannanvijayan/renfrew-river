
// FormatSelector
////////////////////////////////////////////////////////////

/**
 * A selector for a format component.
 */
struct FormatSelector {
  /** The index of the word. */
  word: u32,

  /** The index of the component. */
  shift: u32,

  /** The number of bits in the component. */
  count: u32,
}

/** Get the value mask for a format selector. */
fn format_selector_get_mask(sel: FormatSelector) -> u32 {
  return (1u << sel.count) - 1u;
}

/** Check if a format selector is empty. */
fn format_selector_is_empty(sel: FormatSelector) -> bool {
  return sel.count == 0u;
}

// FormatSelectorWord
////////////////////////////////////////////////////////////

/**
 * A format selector encoded in a single u32.
 */
struct FormatSelectorWord {
  /** The format selector. */
  word: u32
}

/** The bits used to encode the format selector word. */
const FORMAT_SELECTOR_WORD_OFFSET: u32 = 0u;
const FORMAT_SELECTOR_WORD_BITS: u32 = 5u;

/** The bits used to encode the format selector offset. */
const FORMAT_SELECTOR_SHIFT_OFFSET: u32 = 5u;
const FORMAT_SELECTOR_SHIFT_BITS: u32 = 5u;

/** The bits used to encode the format selector count. */
const FORMAT_SELECTOR_COUNT_OFFSET: u32 = 10u;
const FORMAT_SELECTOR_COUNT_BITS: u32 = 5u;

/**
 * Encodes a format selector in a single u32.
 */
fn format_selector_word_encode(selector: FormatSelector) -> FormatSelectorWord {
  return FormatSelectorWord(
    (selector.word << FORMAT_SELECTOR_WORD_OFFSET) |
    (selector.shift << FORMAT_SELECTOR_SHIFT_OFFSET) |
    (selector.count << FORMAT_SELECTOR_COUNT_OFFSET)
  );
}

/**
 * Decodes a format selector from a u32.
 */
fn format_selector_word_decode(fsw: FormatSelectorWord) -> FormatSelector {
  let value: u32 = fsw.word;
  return FormatSelector(
    (value >> FORMAT_SELECTOR_WORD_OFFSET) & ((1u << FORMAT_SELECTOR_WORD_BITS) - 1u),
    (value >> FORMAT_SELECTOR_SHIFT_OFFSET) & ((1u << FORMAT_SELECTOR_SHIFT_BITS) - 1u),
    (value >> FORMAT_SELECTOR_COUNT_OFFSET) & ((1u << FORMAT_SELECTOR_COUNT_BITS) - 1u)
  );
}

// FormatSelectorSpec
////////////////////////////////////////////////////////////

struct FormatSelectorReadSpec {
  /** The format selector. */
  selector: FormatSelector,

  /** The index to write into the output buffer. */
  out_index: u32,
}


// FormatSelectorSpecWord
////////////////////////////////////////////////////////////

/**
 * A format selector spec encoded in a single u32.
 */
struct FormatSelectorSpecWord {
  /** The format selector spec. */
  word: u32
}

/** The bits used to encode the format selector spec word. */
const FORMAT_SELECTOR_OUT_INDEX_OFFSET: u32 = 15u;
const FORMAT_SELECTOR_OUT_INDEX_BITS: u32 = 5u;

/** Encodes a format selector spec in a single u32. */
fn format_selector_spec_word_encode(selector: FormatSelectorReadSpec) -> FormatSelectorSpecWord {
  return FormatSelectorSpecWord(
    (selector.selector.word << FORMAT_SELECTOR_WORD_OFFSET) |
    (selector.selector.shift << FORMAT_SELECTOR_SHIFT_OFFSET) |
    (selector.selector.count << FORMAT_SELECTOR_COUNT_OFFSET) |
    (selector.out_index << FORMAT_SELECTOR_OUT_INDEX_OFFSET)
  );
}

/**
 * Decodes a format selector spec from a u32.
 */
fn format_selector_spec_word_decode(fssw: FormatSelectorSpecWord) -> FormatSelectorReadSpec {
  let value: u32 = fssw.word;
  return FormatSelectorReadSpec(
    FormatSelector(
      (value >> FORMAT_SELECTOR_WORD_OFFSET) & ((1u << FORMAT_SELECTOR_WORD_BITS) - 1u),
      (value >> FORMAT_SELECTOR_SHIFT_OFFSET) & ((1u << FORMAT_SELECTOR_SHIFT_BITS) - 1u),
      (value >> FORMAT_SELECTOR_COUNT_OFFSET) & ((1u << FORMAT_SELECTOR_COUNT_BITS) - 1u)
    ),
    (value >> FORMAT_SELECTOR_OUT_INDEX_OFFSET) &
      ((1u << FORMAT_SELECTOR_OUT_INDEX_BITS) - 1u)
  );
}
