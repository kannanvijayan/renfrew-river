import { Box, Button, Divider, Input, styled, Typography } from "@mui/material";
import DefineRulesetEditorBox from "./DefineRulesetEditorBox";
import { useAppDispatch } from "../../store/hooks";
import DefRulesViewState from "../../state/view/def_rules";
import { DefRulesEntrySelection, DefRulesGeneratorProgramSection } from "../../state/view/def_rules/ruleset";
import GeneratorProgramViewState from "../../state/view/def_rules/generator_program";
import DefineRulesetAddFormatWordDialog from "./DefineRulesetAddFormatWordDialog";
import ShasmProgramInput from "../common/ShasmProgramInput";
import ShasmProgramErrors from "../common/ShasmProgramErrors";
import DefineRulesetAddFormatComponentDialog from "./DefineRulesetAddFormatComponentDialog";

export default function DefineRulesetGeneratorProgramEdit(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  return (
    <DefineRulesetEditorBox title="Generator Program">
      <Box display="flex" flexDirection="row" margin="1rem 0 0 0" padding="0"
        width="100%">
        <DefineRulesetGeneratorProgramItemList viewState={viewState}>
          <FormatItem viewState={viewState} />
          <InitProgramItem viewState={viewState} />
          <IterationsItem viewState={viewState} />
          <PairwiseProgramItem viewState={viewState} />
          <PairwiseOutRegsItem viewState={viewState} />
          <MergeProgramItem viewState={viewState} />
          <FinalProgramItem viewState={viewState} />
        </DefineRulesetGeneratorProgramItemList>
        <DefineRulesetGeneratorProgramFieldList
          viewState={viewState}
          fields={{
            DefineRulesetGeneratorProgramFormat: {
              selection: DefRulesGeneratorProgramSection.FORMAT,
              label: "Format",
              node: <FormatEntry viewState={viewState} />,
            },
            DefineRulesetGeneratorProgramInitProgram: {
              selection: DefRulesGeneratorProgramSection.INIT_PROGRAM,
              label: "Init Program",
              node: <InitProgramEntry viewState={viewState} />,
            },
            DefineRulesetGeneratorProgramIterations: {
              selection: DefRulesGeneratorProgramSection.ITERATIONS,
              label: "Iterations",
              node: <IterationsEntry viewState={viewState} />,
            },
            DefineRulesetGeneratorProgramPairwiseProgram: {
              selection: DefRulesGeneratorProgramSection.PAIRWISE_PROGRAM,
              label: "Pairwise Program",
              node: <PairwiseProgramEntry viewState={viewState} />,
            },
            DefineRulesetGeneratorProgramPairwiseOutRegs: {
              selection: DefRulesGeneratorProgramSection.PAIRWISE_OUTREGS,
              label: "Pairwise OutRegs",
              node: (
                <Typography variant="h5" color={"primary.dark"}
                    margin="0 1rem 0 0" padding="0.5rem" fontWeight={700}
                    width="auto">
                  Pairwise OutRegs
                </Typography>
              ),
            },
            DefineRulesetGeneratorProgramMergeProgram: {
              selection: DefRulesGeneratorProgramSection.MERGE_PROGRAM,
              label: "Merge Program",
              node: <MergeProgramEntry viewState={viewState} />,
            },
            DefineRulesetGeneratorProgramFinalProgram: {
              selection: DefRulesGeneratorProgramSection.FINAL_PROGRAM,
              label: "Final Program",
              node: <FinalProgramEntry viewState={viewState} />,
            },
          }}
        />
      </Box>
    </DefineRulesetEditorBox>
  );
}

function FormatItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const FORMAT = DefRulesGeneratorProgramSection.FORMAT;
  const onClick = () => {
    defRulesDispatch(DefRulesViewState.action.setEntrySelection(FORMAT));
    location.hash = "#DefineRulesetGeneratorProgramFormat";
  };
  const isSelected = viewState.entrySelection === FORMAT;
  return (
    <DefineRulesetGeneratorProgramItem name="Format" onClick={onClick}
        isSelected={isSelected}/>
  );
}

function InitProgramItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Init Program"
        entrySelection={DefRulesGeneratorProgramSection.INIT_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramInitProgram"} />
  );
}

function IterationsItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const ITERATIONS = DefRulesGeneratorProgramSection.ITERATIONS;
  const onClick = () => {
    defRulesDispatch(DefRulesViewState.action.setEntrySelection(ITERATIONS));
    location.hash = "#DefineRulesetGeneratorProgramIterations";
  };
  const isSelected = viewState.entrySelection === ITERATIONS;
  return (
    <DefineRulesetGeneratorProgramItem name="Iterations" onClick={onClick}
        isSelected={isSelected} />
  );
}

function PairwiseProgramItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Pairwise Program"
        entrySelection={DefRulesGeneratorProgramSection.PAIRWISE_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramPairwiseProgram"} />
  );
}

function PairwiseOutRegsItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const PAIRWISE_OUTREGS = DefRulesGeneratorProgramSection.PAIRWISE_OUTREGS;
  const onClick = () => {
    defRulesDispatch(
      DefRulesViewState.action.setEntrySelection(PAIRWISE_OUTREGS)
    );
    location.hash = "#DefineRulesetGeneratorProgramPairwiseOutRegs";
  };
  const isSelected = viewState.entrySelection === PAIRWISE_OUTREGS;
  return (
    <DefineRulesetGeneratorProgramItem name="Pairwise OutRegs" onClick={onClick}
        isSelected={isSelected} />
  );
}

function MergeProgramItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Merge Program"
        entrySelection={DefRulesGeneratorProgramSection.MERGE_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramMergeProgram"} />
  );
}

function FinalProgramItem(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Final Program"
        entrySelection={DefRulesGeneratorProgramSection.FINAL_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramFinalProgram"} />
  );
}

function ProgramItem(props: {
  viewState: DefRulesViewState,
  name: string,
  entrySelection: DefRulesEntrySelection,
  elementId: string,
}) {
  const { viewState, name, entrySelection, elementId } = props;
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const onClick = () => {
    defRulesDispatch(
      DefRulesViewState.action.setEntrySelection(entrySelection)
    );
    location.hash = `#${elementId}`;
  };
  const isSelected = viewState.entrySelection === entrySelection;
  return (
    <DefineRulesetGeneratorProgramItem name={name} onClick={onClick}
        isSelected={isSelected} />
  );
}


function DefineRulesetGeneratorProgramItem(props: {
  name: string,
  onClick: () => void,
  isSelected: boolean,
}) {
  const { name, onClick } = props;
  const UseTypography =
    props.isSelected
      ? SelectedItemTypography
      : ItemTypography;
  return (
    <UseTypography variant="h5" color={"primary.dark"} onClick={onClick}>
      {name}
    </UseTypography>
  );
}

function DefineRulesetGeneratorProgramItemList(props: {
  viewState: DefRulesViewState,
  children: React.ReactNode,
}) {
  const { children } = props;
  return (
    <Box className="DefineRulesetGeneratorProgramItemList"
      display="flex" flexDirection="column" flex="0"
      minHeight="5rem"
      minWidth="20rem"
      margin="1rem 0rem auto 1rem" width="auto" height="auto"
      padding="1rem 0rem 1rem 0.5rem"
      border="2px dotted #622" borderRadius="2rem"
      fontSize="1.5rem" color="#622"
      position="sticky" top="1rem"
      sx={{ textAlign: "right" }}
      >
      {children}
    </Box>
  );
}

const ItemTypography = styled(Typography)({
  margin: "0 1rem .5rem 0",
  padding: "0.25rem 1rem 0 0",
  fontWeight: 700,
  width: "auto",
  "&:hover": {
    cursor: "pointer",
    textShadow: "0 0 0.5rem #ccaa66",
  },
});

const SelectedItemTypography = styled(ItemTypography)({
  backgroundColor: "#622",
  color: "#caa",
  borderRadius: "1rem",
});

function DefineRulesetGeneratorProgramFieldList(props: {
  viewState: DefRulesViewState,
  fields: Record<string, {
    selection: DefRulesEntrySelection,
    label: string,
    node: React.ReactNode,
  }>,
}) {
  const { viewState, fields } = props;
  const dispatch = useAppDispatch.view.connected.defRules();
  const entries = Object.entries(fields);
  return (
    <Box className="DefineRulesetGeneratorProgramFieldList"
        display="flex" flexDirection="column" flex="1"
        width="auto" fontSize="1.5rem" color="#622" textAlign="left"
        margin="0" padding="0 1rem 0 1rem">
      {entries.map(([id, { selection, label, node }], index) => {
        const curSelection = viewState.entrySelection;
        const selected =
          curSelection
            ?  DefRulesEntrySelection.mapToId(curSelection) === id
            : false;
        const headerTextColor = selected ? "#622" : "#caa";
        const headerTextBg = selected ? "#caa" : "#622";
        const border = selected ? "2px solid #caa" : "2px solid #622";
        const onClick = () => {
          dispatch(DefRulesViewState.action.setEntrySelection(selection));
        };
        return (
          <>
          <Typography variant="h5" color="#622"
            margin="4rem auto 0 4rem" padding="0.5rem 2rem"
            borderRadius={"1rem 1rem 0 0"} id={id}
            onClick={onClick}
            fontWeight={700} width="auto" sx={{
              backgroundColor: headerTextBg,
              color: headerTextColor,
            }}>
            {label}
          </Typography>
          <Box key={index}
            display={"flex"} flexDirection={"column"}
            margin="0 1rem" padding="1rem" width="auto" height="auto"
            border={border} borderRadius="2rem"
            fontSize="1.5rem" color="#622"
            sx={{ textAlign: "left" }}
            onClick={onClick}>
            {node}
          </Box>
          </>
        );
      })}
    </Box>
  );
}

function FormatEntry(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const dialogState = viewState.generatorProgram.addFormatWordDialog;
  const onAddWordClick = () => {
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatWordDialog({
        ...dialogState,
        visible: true,
      })
    );
  };
  return (
    <>
      <Button size="small" variant="contained"
          sx={{
            margin: "0 auto 1rem 1rem",
            fontSize: "1.1rem",
            textTransform: "none",
          }}
          onClick={onAddWordClick}>
        Add Word
      </Button>
      <FormatWordList viewState={viewState} />
      <DefineRulesetAddFormatWordDialog
          visible={dialogState.visible} viewState={viewState} />
    </>
  );
}

function FormatWordList(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const formatInputState = viewState.generatorProgram.format;
  return (
    <Box display="flex" flexDirection="column"
      margin="0 auto 0 0" padding="2rem"
      borderColor={"#622"} border="1px solid"
      width="auto" borderRadius="1rem">
      {
        formatInputState.wordFormats.map((wordFormat, index) => (
          <FormatWordListEntry viewState={viewState}
              index={index} name={wordFormat.name} />
        ))
      }
    </Box>
  );
}

function FormatWordListEntry(props: {
  viewState: DefRulesViewState,
  index: number,
  name: string,
}) {
  const { viewState, index, name } = props;
  const formatInput = viewState.generatorProgram.format;
  const dialogState = viewState.generatorProgram.addFormatComponentDialog;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const onAddComponentClick = () => {
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatComponentDialog({
        ...dialogState, 
        visible: true,
      })
    );
  };
  const components = formatInput.wordFormats[index].components;

  return (
    <Box key={index} display="flex" flexDirection="column"
      margin="0" padding="0">
      <Box key={index} display="flex" flexDirection="row"
        margin="0" padding="0" width="100%">
        <Button size="small" variant="contained" onClick={onAddComponentClick}
            sx={{
              flex: 0,
              margin: "auto 1rem auto 0", fontSize: "1rem", textTransform: "none",
              padding: "0", height: "1rem", alignContent: "right",
            }}>
          +
        </Button>
        <Typography variant="h5" color={"primary.dark"}
          margin="0 1rem 0 0" padding="0"
          fontSize="1.1rem" width="5rem" textAlign={"left"}
          alignContent={"center"}>
          WORD {index}
        </Typography> 
        <Typography variant="h5" color={"primary.dark"}
          margin="0 1rem" padding="0" fontWeight={700}
          fontSize={"1.5rem"}
          width="auto" textAlign={"left"}>
          {name}
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column" margin="1rem 0 0 1rem" padding="0">
        {
          components.map((component, index) => {
            let startBit: number | undefined = undefined;
            if (/^\d+$/.test(component.offset)) {
              startBit = parseInt(component.offset);
            }
            let endBit: number | undefined = undefined;
            if (/^\d+$/.test(component.bits)) {
              const numBits = parseInt(component.bits);
              endBit = startBit !== undefined ? (startBit + numBits - 1) : undefined;
            }

            return (
              <Box key={index} display="flex" flexDirection="row"
                margin="0" padding="0">
                <Typography variant="h5" color={"primary.dark"}
                  margin="0 0.5rem 0" padding="0" fontWeight={700}
                  fontSize="1.1rem"
                  width="4rem" textAlign={"right"}>
                  {startBit} .. {endBit}
                </Typography>
                <Typography variant="h5" color={"primary.dark"}
                  margin="0 0 0 0.5rem" padding="0"
                  fontSize="1.1rem"
                  width="5rem" textAlign={"left"}>
                  ({component.bits} bits)
                </Typography>
                <Typography variant="h5" color={"primary.dark"}
                  margin="0 0.5rem 0 0" padding="0"
                  width="5rem" textAlign={"right"} fontWeight={700}
                  fontSize="1.1rem">
                  {component.name}
                </Typography>
              </Box>
            );
          })
        }
      </Box>
      <Divider sx={{
        backgroundColor: "#622",
        height: "1px",
        width: "100%",
        margin: "1rem 0 0.5rem 0",
      }}/>
      <DefineRulesetAddFormatComponentDialog viewState={viewState}
          wordIndex={index} visible={dialogState.visible} />
    </Box>
  );
}

function InitProgramEntry(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.initProgram;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const onChange = (programText: string) => {
    console.log("InitProgramEntry.onChange", programText);
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setInitProgram(programText)
    );
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}

function IterationsEntry(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const iterations = viewState.generatorProgram.iterations;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const onChange = (iterations: string) => {
    console.log("IterationsEntry.onChange", iterations);
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setIterations(iterations)
    );
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <Input value={iterations} onChange={e => onChange(e.target.value)}
          sx={{
            backgroundColor: "#cb8",
            borderRadius: "0.5rem",
            height: "2rem",
            width: "10rem",
            fontSize: "1.5rem",
            padding: "0 0.5rem",
            margin: 0,
          }} />
      <Button size="small" variant="contained" sx={{
        margin: "0 0.25rem 0 0.5rem", height: "2rem",
        fontSize: "1.5rem", fontWeight: 700,
      }}>
        -
      </Button>
      <Button size="small" variant="contained" sx={{
        margin: "0 0.25rem 0 0", height: "2rem",
        fontSize: "1.5rem", fontWeight: 700,
      }}>
        +
      </Button>
    </Box>
  );
}

function PairwiseProgramEntry(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.pairwiseProgram;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const onChange = (programText: string) => {
    console.log("PairwiseProgramEntry.onChange", programText);
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setPairwiseProgram(programText)
    );
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}

function MergeProgramEntry(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.mergeProgram;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const onChange = (programText: string) => {
    console.log("MergeProgramEntry.onChange", programText);
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setMergeProgram(programText)
    );
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}

function FinalProgramEntry(props: { viewState: DefRulesViewState }) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.finalProgram;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.generatorProgram();
  const onChange = (programText: string) => {
    console.log("FinalProgramEntry.onChange", programText);
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setFinalProgram(programText)
    );
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}
