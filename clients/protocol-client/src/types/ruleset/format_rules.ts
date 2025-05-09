
type FormatRules = {
  wordFormats: FormatWordRules[],
};
export default FormatRules;

export type FormatWordRules = {
  name: string,
  components: FormatComponentRules[],
};

export type FormatComponentRules = {
  name: string,
  offset: number,
  bits: number,
};

export type FormatComponentInput = {
  name: string,
  offset: string,
  bits: string,
};
export type FormatComponentValidation = {
  errors: string[],
  name: string[],
  offset: string[],
  bits: string[],
};
export type FormatWordInput = {
  name: string,
  components: FormatComponentInput[],
};
export type FormatWordValidation = {
  errors: string[],
  components: FormatComponentValidation[],
};
export type FormatInput = {
  wordFormats: FormatWordInput[],
};
export type FormatValidation = {
  errors: string[],
  wordFormats: FormatWordValidation[],
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
              name: `${format.wordFormats.length}`,
              components: [
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
        name: "0",
        components: [ { name, offset: 0, bits } ],
      },
    ],
  };
}

function wordFormatUsedBits(wordFormat: FormatWordRules): number {
  let usedBits = 0;
  for (const component of wordFormat.components) {
    usedBits += component.bits;
  }
  return usedBits;
}
