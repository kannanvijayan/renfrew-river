import { ruleset, ShasmProgram } from "renfrew-river-protocol-client";

import { atom } from 'jotai';
import DefRulesGameMode from "../game/mode/def_rules";

const rulesetNameAtom = atom<string>("");
const rulesetNameErrorsAtom = atom<string[]>([]);

const rulesetDescriptionAtom = atom<string>("");
const rulesetDescriptionErrorsAtom = atom<string[]>([]);

const perlinSeedAtom = atom<string>("1");
const perlinSeedErrorsAtom = atom<string[]>([]);

const perlinOctavesAtom = atom<string>("1");
const perlinOctavesErrorsAtom = atom<string[]>([]);

const perlinFrequencyAtom = atom<string>("1");
const perlinFrequencyErrorsAtom = atom<string[]>([]);

const perlinAmplitudeAtom = atom<string>("1");
const perlinAmplitudeErrorsAtom = atom<string[]>([]);

const perlinRegisterAtom = atom<string>("0");
const perlinRegisterErrorsAtom = atom<string[]>([]);

type TerrainGenPerlinRulesInput = {
  [T in keyof ruleset.TerrainGenPerlinRules]:
    (
      ruleset.TerrainGenPerlinRules[T] extends number
        ? string
        : ruleset.TerrainGenPerlinRules[T]
    );
};
const perlinRulesAtom = atom<TerrainGenPerlinRulesInput>(get => {
  return {
    seed: get(perlinSeedAtom),
    seedErrors: get(perlinSeedErrorsAtom),

    octaves: get(perlinOctavesAtom),
    octavesErrors: get(perlinOctavesErrorsAtom),

    frequency: get(perlinFrequencyAtom),
    frequencyErrors: get(perlinFrequencyErrorsAtom),

    amplitude: get(perlinAmplitudeAtom),
    amplitudeErrors: get(perlinAmplitudeErrorsAtom),

    register: get(perlinRegisterAtom),
    registerErrors: get(perlinRegisterErrorsAtom),
  };
});
const perlinRules = {
  seed: perlinSeedAtom,
  seedErrors: perlinSeedErrorsAtom,

  octaves: perlinOctavesAtom,
  octavesErrors: perlinOctavesErrorsAtom,

  frequency: perlinFrequencyAtom,
  frequencyErrors: perlinFrequencyErrorsAtom,

  amplitude: perlinAmplitudeAtom,
  amplitudeErrors: perlinAmplitudeErrorsAtom,

  register: perlinRegisterAtom,
  registerErrors: perlinRegisterErrorsAtom,
};

const stageFormatRulesAtom = atom<ruleset.FormatRules>({ wordFormats: [] });
const stageFormatErrorsAtom = atom<Record<number, string[]>>([]);

const initProgramRulesAtom = atom<ShasmProgram>({ programText: "" });
const pairwiseProgramRulesAtom = atom<ShasmProgram>({ programText: "" });
const mergeProgramRulesAtom = atom<ShasmProgram>({ programText: "" });
const finalProgramRulesAtom = atom<ShasmProgram>({ programText: "" });

const stageIterationsAtom = atom<string>("1");
const stagePairwiseOutputRegistersAtom = atom<string>("1");

type TerrainGenStageRulesInput = {
  [T in keyof ruleset.TerrainGenStageRules]:
    (
      ruleset.TerrainGenStageRules[T] extends number
        ? string
        : ruleset.TerrainGenStageRules[T]
    );
};
const stageRulesAtom = atom<TerrainGenStageRulesInput>(get => {
  return {
    format: get(stageFormatRulesAtom),
    initProgram: get(initProgramRulesAtom),
    iterations: get(stageIterationsAtom),
    pairwiseProgram: get(pairwiseProgramRulesAtom),
    pairwiseOutputRegisters: get(stagePairwiseOutputRegistersAtom),
    mergeProgram: get(mergeProgramRulesAtom),
    finalProgram: get(finalProgramRulesAtom),
  }
});

type TerrainGenRulesInput = {
  perlin: TerrainGenPerlinRulesInput,
  stage: TerrainGenStageRulesInput,
};
const terrainGenRulesAtom = atom<TerrainGenRulesInput>(get => {
  return {
    perlin: get(perlinRulesAtom),
    stage: get(stageRulesAtom),
  };
});


type RulesetInput = {
  name: string,
  description: string,
  terrainGen: TerrainGenRulesInput,
};
const rulesetAtom = atom<RulesetInput>(get => {
  return {
    name: get(rulesetNameAtom),
    description: get(rulesetDescriptionAtom),
    terrainGen: get(terrainGenRulesAtom),
  };
});

const defRulesGameModeAtom = atom<DefRulesGameMode | null>(null);

type DefRulesViewState = {
  ruleset: RulesetInput,
  gameMode: DefRulesGameMode | null,
};
const defRulesViewStateAtom = atom<DefRulesViewState>(get => {
  return {
    ruleset: get(rulesetAtom),
    gameMode: get(defRulesGameModeAtom),
  };
});

export default DefRulesViewState;
export {
  defRulesViewStateAtom,
  rulesetAtom,
  rulesetNameAtom,
  rulesetDescriptionAtom,

  perlinRules,

  stageFormatRulesAtom,
  stageRulesAtom,

  initProgramRulesAtom,
  pairwiseProgramRulesAtom,
  mergeProgramRulesAtom,
  finalProgramRulesAtom,
};
