
export type FormatRulesComponent = {
  name: string,
  offset: number,
  bits: number,
};

export type FormatRulesWord = {
  components: FormatRulesComponent[],
};

export type FormatRules = {
  word_formats: FormatRulesWord[],
};
