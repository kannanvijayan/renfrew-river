
export type FormatRulesComponent = {
  name: string,
  offset: number,
  bits: number,
};

export type FormatRulesWord = {
  components: FormatRulesComponent[],
};

export type FormatRules = {
  wordFormats: FormatRulesWord[],
};

export function addFormatRuleComponent(format: FormatRules, name: string, bits: number): FormatRules {
  // Check each existing word format for enough space to add the new component
  for (const wordFormat of format.wordFormats) {
    const usedBits = wordFormatUsedBits(wordFormat);
    const availableSpace = 32 - usedBits;
    if (availableSpace >= bits) {
      return {
        wordFormats: format.wordFormats.map((existingWordFormat) => {
          if (existingWordFormat === wordFormat) {
            return {
              components: [
                ...existingWordFormat.components,
                { name, offset: usedBits, bits },
              ],
            };
          } else {
            return existingWordFormat;
          }
        })
      };
    }
  }
  return {
    wordFormats: [
      ...format.wordFormats,
      {
        components: [ { name, offset: 0, bits } ],
      },
    ],
  };
}

function wordFormatUsedBits(wordFormat: FormatRulesWord): number {
  let usedBits = 0;
  for (const component of wordFormat.components) {
    usedBits += component.bits;
  }
  return usedBits;
}
