
export type ShadyRegister = number;

export type ShadyProgram = {
  bitcode: ShadyBitcodeInstruction[]
}

export type ShadyBitcodeInstruction = [number, number];
