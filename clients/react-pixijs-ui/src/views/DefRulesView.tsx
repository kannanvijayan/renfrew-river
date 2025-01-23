

import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Input,
  Modal,
  Typography,
} from '@mui/material';

import Screen from '../components/Screen';
import ConnectedTopBar from '../components/ConnectedTopBar';
import DefRulesGameMode from '../game/mode/def_rules';
import GameClient, { ruleset, ShasmParseError } from 'renfrew-river-protocol-client';

import "./DefRulesView.css";
import { DelayLatch } from '../util/delay_latch';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  rulesetNameAtom,
  rulesetDescriptionAtom,

  perlinRules,
  stageFormatRulesAtom,
  initProgramRulesAtom,
  pairwiseProgramRulesAtom,
  mergeProgramRulesAtom,
  finalProgramRulesAtom,
} from '../view_state/DefRulesViewState';

export type DefRulesViewMode =
  | "ruleset" | "terrain_gen" | "perlin_params" | "generation_params"
  | "format" | "init_program" | "pairwise_program" | "merge_program" | "final_program";

const ViewModeInclusion: Record<DefRulesViewMode, DefRulesViewMode[]> = {
  "ruleset": ["terrain_gen"],
  "terrain_gen": ["perlin_params", "generation_params"],
  "perlin_params": [],
  "generation_params": [
    "format",
    "init_program",
    "pairwise_program",
    "merge_program",
    "final_program",
  ],
  "format": [],
  "init_program": [],
  "pairwise_program": [],
  "merge_program": [],
  "final_program": [],
};
function viewModeAllows(mode: DefRulesViewMode, current: DefRulesViewMode): boolean {
  return mode === current ||
    ViewModeInclusion[mode].some(
      childMode => viewModeAllows(childMode, current)
    );
}

const defRulesErrorsAtom = atom<string[]>([]);
const defRulesViewModeAtom = atom<DefRulesViewMode>("ruleset");

// The main screen for the game when connected to a server.
// Shows a centered menu of selections.
export default function DefRulesView(props: {
  instance: DefRulesGameMode,
}) {
  const { instance } = props;
  return (
    <Screen>
      <ConnectedTopBar
        session={instance.serverSession}
        onDisconnectClicked={() => {
          alert("TODO: Implement disconnect");
        }}
      />
      <DefRulesFrame instance={instance} />
    </Screen>
  );
};

function DefRulesFrame(props: {
  instance: DefRulesGameMode,
}) {
  const { instance } = props;
  const viewMode = useAtomValue(defRulesViewModeAtom);

  return (
    <Box display="flex" flexDirection="row" width="100%" height="100%" mt={2}>
        <DefRulesMainColumn />
        {
          viewModeAllows("terrain_gen", viewMode)
            ? <DefRulesTerrainGenColumn />
            : null
        }
        {
          viewModeAllows("perlin_params", viewMode)
            ? <DefRulesPerlinParamsColumn />
            : null
        }
        {
          viewModeAllows("generation_params", viewMode)
            ? <DefRulesGenerationParams />
            : null
        }
        {
          viewModeAllows("format", viewMode)
            ? <DefRulesGenerationFormat />
            : null
        }
        {
          viewModeAllows("init_program", viewMode)
            ? <DefRulesGenerationInitProgram instance={instance} />
            : null
        }
        {
          viewModeAllows("pairwise_program", viewMode)
            ? <DefRulesGenerationPairwiseProgram instance={instance} />
            : null
        }
        {
          viewModeAllows("merge_program", viewMode)
            ? <DefRulesGenerationMergeProgram instance={instance} />
            : null
        }
        {
          viewModeAllows("final_program", viewMode)
            ? <DefRulesGenerationFinalProgram instance={instance} />
            : null
        }
    </Box>
  );
}

// The main screen for the game when connected to a server.
// Shows a centered menu of selections.
function DefRulesMainColumn() {
  const [rulesetName, setRulesetName] = useAtom(rulesetNameAtom);
  const [rulesetDescription, setRulesetDescription] =
    useAtom(rulesetDescriptionAtom);
  const setViewMode = useSetAtom(defRulesViewModeAtom);
  const errors = useAtomValue(defRulesErrorsAtom);

  return (
    <Box display="flex" flexDirection="column" width="20em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5} 
            fontWeight={600}>
            Ruleset
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Name
          </Typography>
          <Input type="text" placeholder="Ruleset name"
            value={rulesetName}
            onChange={(e) => setRulesetName(e.target.value)}
          />
        </Box>
        <Box display="flex" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Descr
          </Typography>
          <Input type="text" placeholder="Description"
            value={rulesetDescription}
            onChange={(e) => setRulesetDescription(e.target.value)}
          />
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto" m="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }}
            onClick={() => setViewMode("terrain_gen")}>
            Terrain Generation
          </Button>
        </Box>
        {
          (errors.length > 0) ? (
            <Box display="flex" flexDirection="column" width="100%" height="auto" m="auto" mt={4}
                borderTop={1} borderColor={"error.dark"}>
            {
              errors.map((error, i) => (
                <Typography variant="body1" margin={2} padding={0} color="error.dark"
                  fontWeight={600} key={i} fontSize={20}>
                  {error}
                </Typography>
              ))
            }
            </Box>
          ) : null
        }
    </Box>
  );
}

function DefRulesTerrainGenColumn() {
  const setViewMode = useSetAtom(defRulesViewModeAtom);

  return (
    <Box display="flex" flexDirection="column" width="20em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5} 
            fontWeight={600}>
            Terrain Gen
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }}
            onClick={() => setViewMode("perlin_params")}>
            Perlin Params
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            sx={{ fontWeight: 600 }}
            onClick={() => setViewMode("generation_params")}>
            Generation Params
          </Button>
        </Box>
    </Box>
  );
}

function DefRulesPerlinParamsColumn() {
  const [seed, setSeed] = useAtom(perlinRules.seed);
  const [octaves, setOctaves] = useAtom(perlinRules.octaves);
  const [frequency, setFrequency] = useAtom(perlinRules.frequency);
  const [amplitude, setAmplitude] = useAtom(perlinRules.amplitude);
  const [register, setRegister] = useAtom(perlinRules.register);

  return (
    <Box display="flex" flexDirection="column" width="20em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5} 
            fontWeight={600}>
            Perlin Params
          </Typography>
        </Container>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Seed
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }}
            value={seed}
            onChange={(e) => setSeed(e.target.value)} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Octaves
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }}
            value={octaves}
            onChange={(e) => {
              const ival = parseInt(e.target.value);
              if (Number.isInteger(ival)) {
                setOctaves(ival);
              }
            }} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Frequency
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }}
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value))} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Amplitude
          </Typography>
          <Input type="text" placeholder="###" sx={{ width: "10em", mr: 5 }}
            value={amplitude}
            onChange={(e) => setAmplitude(parseInt(e.target.value))} />
        </Box>
        <Box display="flex" justifyContent="flex-end" flexDirection="row" width="auto" height="auto" mt={1}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Register
          </Typography>
          <Input type="text" placeholder="0 to 255" sx={{ width: "10em", mr: 5 }}
            value={register}
            onChange={(e) => setRegister(parseInt(e.target.value))} />
        </Box>
    </Box>
  );
}

function DefRulesGenerationParams() {
  const setViewMode = useSetAtom(defRulesViewModeAtom);
  return (
    <Box display="flex" flexDirection="column" width="30em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5}
            fontWeight={600}>
            Generation Params
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setViewMode("format")}
            sx={{ fontWeight: 600 }} >
            Format
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setViewMode("init_program")}
            sx={{ fontWeight: 600 }} >
            Init Program
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setViewMode("pairwise_program")}
            sx={{ fontWeight: 600 }} >
            Pairwise Program
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setViewMode("merge_program")}
            sx={{ fontWeight: 600 }} >
            Merge Program
          </Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto"
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setViewMode("final_program")}
            sx={{ fontWeight: 600 }} >
            Final Program
          </Button>
        </Box>
    </Box>
  );
}

const addFormatModelOpenAtom = atom(false);

function DefRulesGenerationFormat() {
  const [stageFormatRules, setStageFormatRules] = useAtom(stageFormatRulesAtom);
  const setAddFormatModalOpen = useSetAtom(addFormatModelOpenAtom);
  return (
    <Box display="flex" flexDirection="column" width="30em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} color="primary.light"
            fontWeight={600}>
            Format
          </Typography>
        </Container>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={4}
             borderTop={1} borderColor={"primary.main"}>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setAddFormatModalOpen(true)}
            sx={{ fontWeight: 600 }} >
            Add Component
          </Button>
          <Button variant="text" color="primary" size="large" fullWidth
            onClick={() => setStageFormatRules({ wordFormats: [] })}
            sx={{ fontWeight: 600 }} >
            Clear Components
          </Button>
          <DefRulesGenerationAddFormatComponentModal />
        </Box>
        <Box display="flex" flexDirection="column" width="auto" height="100%" mt={4}
             m={2} border={1} borderRadius={5} borderColor={"primary.main"}
             overflow={"scroll"}>
          {
            stageFormatRules.wordFormats.map((format, fmtIdx) => {
              return format.components.map((component, compIdx) => (
                <Typography variant="body1" margin={1} padding={0} color="primary.light"
                  textAlign={"left"}
                  fontWeight={600} key={`fmt-${fmtIdx}-comp-${compIdx}`}>
                  {component.name} : word{fmtIdx} bits({component.offset} .. {component.offset + component.bits})
                </Typography>
              ));
            })
          }
        </Box>
    </Box>
  );
}

function DefRulesGenerationAddFormatComponentModal() {
  const [addFormatModalOpen, setAddFormatModalOpen] =
    useAtom(addFormatModelOpenAtom);
  const [stageFormatRules, setStageFormatRules] =
    useAtom(stageFormatRulesAtom);

  const formatNameRef = useRef("");
  const formatBitsRef = useRef(0);

  const onAddClicked = () => {
    setStageFormatRules(
      ruleset.addFormatRuleComponent(
        stageFormatRules,
        formatNameRef.current,
        formatBitsRef.current
      )
    );
    setAddFormatModalOpen(false);
  };

  return (
    <Modal open={addFormatModalOpen} onClose={() => setAddFormatModalOpen(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
      <Box display="flex" flexDirection="column" width="20em" height="auto"
        py={1} boxShadow={5} position={"absolute"}
        sx={{ backgroundColor: 'secondary.dark' }} >
        <Typography variant="h4" mx="auto" color="primary.light" fontWeight={600}
          borderBottom={1} borderColor={"primary.main"} pb={1} >
          New Component
        </Typography>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={2}
              borderColor={"primary.main"}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Name
          </Typography>
          <Input type="text" placeholder="Format name"
            onChange={(e) => formatNameRef.current = e.target.value} />
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={2}
              borderColor={"primary.main"}>
          <Typography variant="body1" margin={2} padding={0} color="primary.light"
            fontWeight={600}>
            Bits
          </Typography>
          <Input type="text" placeholder="Number of bits"
            onChange={(e) => formatBitsRef.current = parseInt(e.target.value)} />
        </Box>
        <Box display="flex" flexDirection="row" width="100%" height="auto" mt={2}
              borderColor={"primary.main"}>
          <Button variant="contained" color="primary" size="large" fullWidth
            onClick={onAddClicked}
            sx={{ fontWeight: 600, margin: 3 }} >
            Add
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

async function syntaxCheckShasm(
  programText: string,
  client: GameClient,
): Promise<(true|string[])[]> {
  const validated = await client.validateShasm(programText);
  const errors: ShasmParseError[] = [];
  if (validated !== true) {
    errors.push(...validated);
  }
  return programText.split("\n").map((_line, i) => {
    const filtered = errors.filter(error => error.lineNo === i);
    return (filtered.length === 0) ? true : filtered.map(error => error.message);
  });
}

function DefRulesGenerationProgramColumn(
  props: {
    instance: DefRulesGameMode,
    title: string,
    placeholder: string,
    programText: string,
    onChange: (program: string) => void,
    sideInfo: (true|string[])[],
    setSideInfo: (info: (true|string[])[]) => void,
  }
) {
  const { sideInfo, setSideInfo } = props;
  const [hover, setHover] = useState<number|null>(null);

  const delayLatch = new DelayLatch<string>(1000, async (program) => {
    const syntaxChecked = await syntaxCheckShasm(
      program,
      props.instance.serverSession.client,
    );
    setSideInfo(syntaxChecked);
  });

  const onChange = async (program: string) => {
    delayLatch.trigger(program);
    props.onChange(program);
  };

  return (
    <Box display="flex" flexDirection="column" width="30em"
      m={0} ml={1} py={1} boxShadow={5}
      sx={{ backgroundColor: 'secondary.dark' }} >
        <Container sx={{ width: "100%", height: "auto" }}>
          <Typography variant="h4" margin="auto" border={1} p={1} color="primary.light"
            boxShadow={5}
            fontWeight={600}>
            {props.title}
          </Typography>
        </Container>
        <Box position="relative" display="flex" flexDirection="row" width="auto" height="100%" mt={4}
             m={2} border={1} borderRadius={5} borderColor={"primary.main"} >
          <Box className="ShasmLineAnnot"
            left="1em" top="1em" bottom="1em" width="3em"
            mt="5px" ml="1em" pr="1em" borderRight={1} borderColor={"primary.main"}>
            {
              sideInfo.map((ok, i) => {
                return (ok === true) ?
                  (
                    <Typography variant="body1" mb={"2px"} padding={0} color="primary.light"
                       textAlign={"center"} key={"t"+i} fontSize={"10px"} fontFamily={"monospace"}>
                      ✅
                    </Typography>
                  ) :
                  (<div key={"u"+i} style={{ position: "relative" }}>
                    <span onMouseOver={_ev => setHover(i)}
                          onMouseOut={_ev => setHover(null)}
                          key={"x"+i} style={{ cursor: "pointer" }}>
                      ❌
                    </span>
                    <div style={{ position: "absolute", left: "1em", top: "2em", width: "auto",
                      backgroundColor: "#ea8", color: "#f00", padding: "0.5em", borderRadius: "5px",
                      display: hover === i ? "block" : "none" }}
                        key={"y"+i}>
                      {
                        ok.map((error, j) => (
                          <div key={"z"+j}>line {j+1}: {error}</div>
                        ))
                      }
                    </div>
                  </div>)
                }
              )
            }
          </Box>
          <textarea className="ShasmEditor"
            style={{
              left: "0em", top: "1em", right: "1em", bottom: "1em", width: "100%",
              font: "14px monospace",
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflowX: "scroll",
            }}
            onChange={(e) => onChange(e.target.value)}
            value={props.programText}
          />
        </Box>
    </Box>
  );
}

const initProgramSideInfoAtom = atom<(true|string[])[]>([]);

function DefRulesGenerationInitProgram(props: {
  instance: DefRulesGameMode,
}) {
  const { instance } = props;
  const [initProgramRules, setInitProgramRules] = useAtom(initProgramRulesAtom);
  const [sideInfo, setSideInfo] = useAtom(initProgramSideInfoAtom);
  return (
    <DefRulesGenerationProgramColumn
      instance={instance}
      title="Init Program"
      placeholder="Init program"
      programText={initProgramRules.programText}
      onChange={async (program) => {
        setInitProgramRules({ programText: program });
      }}
      sideInfo={sideInfo}
      setSideInfo={setSideInfo}
    />
  );
}

const pairwiseProgramSideInfoAtom = atom<(true|string[])[]>([]);

function DefRulesGenerationPairwiseProgram(props: {
  instance: DefRulesGameMode,
}) {
  const { instance } = props;
  const [pairwiseProgramRules, setPairwiseProgramRules] = useAtom(pairwiseProgramRulesAtom);
  const [sideInfo, setSideInfo] = useAtom(pairwiseProgramSideInfoAtom);
  return (
    <DefRulesGenerationProgramColumn
      instance={instance}
      title="Pairwise Program"
      placeholder="Pairwise program"
      programText={pairwiseProgramRules.programText}
      onChange={async (program) => {
        setPairwiseProgramRules({ programText: program });
      }}
      sideInfo={sideInfo}
      setSideInfo={setSideInfo}
    />
  );
}

const mergeProgramSideInfoAtom = atom<(true|string[])[]>([]);

function DefRulesGenerationMergeProgram(props: {
  instance: DefRulesGameMode,
}) {
  const { instance } = props;
  const [mergeProgramRules, setMergeProgramRules] =
    useAtom(mergeProgramRulesAtom);
  const [sideInfo, setSideInfo] = useAtom(mergeProgramSideInfoAtom);
  return (
    <DefRulesGenerationProgramColumn
      instance={instance}
      title="Merge Program"
      placeholder="Merge program"
      programText={mergeProgramRules.programText}
      onChange={async (program) => {
        setMergeProgramRules({ programText: program });
      }}
      sideInfo={sideInfo}
      setSideInfo={setSideInfo}
    />
  );
}

const finalProgramSideInfoAtom = atom<(true|string[])[]>([]);

function DefRulesGenerationFinalProgram(props: {
  instance: DefRulesGameMode,
}) {
  const { instance } = props;
  const [finalProgramRules, setFinalProgramRules] =
    useAtom(finalProgramRulesAtom);
  const [sideInfo, setSideInfo] = useAtom(finalProgramSideInfoAtom);
  return (
    <DefRulesGenerationProgramColumn
      instance={instance}
      title="Final Program"
      placeholder="Final program"
      programText={finalProgramRules.programText}
      onChange={async (program) => {
        setFinalProgramRules({ programText: program });
      }}
      sideInfo={sideInfo}
      setSideInfo={setSideInfo}
    />
  );
}
