
export type ShadyRegister = number;

export type ShasmProgram = {
  programText: string,
};

export type ShasmProgramValidation = {
  errors: ShasmParseError[],
};

export type ShasmParseError = {
  lineNo: number,
  message: string,
};
