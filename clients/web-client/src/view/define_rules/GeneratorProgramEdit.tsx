import { Box, Button, Divider, Input, styled, Typography } from "@mui/material";
import EditorBox from "./EditorBox";
import { useAppDispatch } from "../../store/hooks";
import DefineRulesViewState from "../../state/view/define_rules";
import { DefineRulesEntrySelection, DefineRulesGeneratorProgramSection } from "../../state/view/define_rules/ruleset";
import GeneratorProgramViewState from "../../state/view/define_rules/generator_program";
import AddFormatWordDialog from "./AddFormatWordDialog";
import ShasmProgramInput from "../common/ShasmProgramInput";
import ShasmProgramErrors from "../common/ShasmProgramErrors";
import AddFormatComponentDialog from "./AddFormatComponentDialog";
import ValidationErrors from "./ValidationErrors";
import { ShasmParseError } from "renfrew-river-protocol-client";

const useGeneratorProgramDispatch =
  useAppDispatch.view.connected.defRules.terrainGeneration.generatorProgram;

export default function GeneratorProgramEdit(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  const terrainGenerationViewState = viewState.terrainGeneration;
  const generatorProgramViewState = terrainGenerationViewState.generatorProgram;
  const generatorProgramValidation = viewState.validation?.terrainGen?.stage;
  return (
    <EditorBox title="Generator Program">
      <Box display="flex" flexDirection="row" margin="1rem 0 0 0" padding="0"
        width="100%">
        <ItemList>
          <FormatItem viewState={viewState}
              errors={generatorProgramValidation?.format?.errors} />
          <InitProgramItem viewState={viewState}
              errors={generatorProgramValidation?.initProgram?.errors} />
          <IterationsItem viewState={viewState}
              errors={generatorProgramValidation?.iterations} />
          <PairwiseProgramItem viewState={viewState}
              errors={generatorProgramValidation?.pairwiseProgram?.errors} />
          <MergeProgramItem viewState={viewState}
              errors={generatorProgramValidation?.mergeProgram?.errors} />
          <FinalProgramItem viewState={viewState}
              errors={generatorProgramValidation?.finalProgram?.errors} />
        </ItemList>
        <FieldList
          viewState={viewState}
          fields={{
            DefineRulesetGeneratorProgramFormat: {
              selection: DefineRulesGeneratorProgramSection.FORMAT,
              label: "Format",
              node: <FormatEntry viewState={generatorProgramViewState} />,
            },
            DefineRulesetGeneratorProgramInitProgram: {
              selection: DefineRulesGeneratorProgramSection.INIT_PROGRAM,
              label: "Init Program",
              node: <InitProgramEntry viewState={generatorProgramViewState} />,
            },
            DefineRulesetGeneratorProgramIterations: {
              selection: DefineRulesGeneratorProgramSection.ITERATIONS,
              label: "Iterations",
              node: <IterationsEntry viewState={generatorProgramViewState} />,
            },
            DefineRulesetGeneratorProgramPairwiseProgram: {
              selection: DefineRulesGeneratorProgramSection.PAIRWISE_PROGRAM,
              label: "Pairwise Program",
              node: <PairwiseProgramEntry viewState={generatorProgramViewState} />,
            },
            DefineRulesetGeneratorProgramMergeProgram: {
              selection: DefineRulesGeneratorProgramSection.MERGE_PROGRAM,
              label: "Merge Program",
              node: <MergeProgramEntry viewState={generatorProgramViewState} />,
            },
            DefineRulesetGeneratorProgramFinalProgram: {
              selection: DefineRulesGeneratorProgramSection.FINAL_PROGRAM,
              label: "Final Program",
              node: <FinalProgramEntry viewState={generatorProgramViewState} />,
            },
          }}
        />
      </Box>
    </EditorBox>
  );
}

function FormatItem(props: {
  viewState: DefineRulesViewState,
  errors: string[] | undefined,
}) {
  const { viewState, errors } = props;
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const FORMAT = DefineRulesGeneratorProgramSection.FORMAT;
  const onClick = () => {
    defRulesDispatch(DefineRulesViewState.action.setEntrySelection(FORMAT));
    location.hash = "#DefineRulesetGeneratorProgramFormat";
  };
  const isSelected = viewState.entrySelection === FORMAT;
  return (
    <Item name="Format" onClick={onClick}
        isSelected={isSelected} errors={errors} />
  );
}

function InitProgramItem(props: {
  viewState: DefineRulesViewState,
  errors: ShasmParseError[] | undefined,
}) {
  const { viewState, errors } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Init Program"
        entrySelection={DefineRulesGeneratorProgramSection.INIT_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramInitProgram"}
        errors={errors} />
  );
}

function IterationsItem(props: {
  viewState: DefineRulesViewState,
  errors: string[] | undefined,
}) {
  const { viewState, errors } = props;
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const ITERATIONS = DefineRulesGeneratorProgramSection.ITERATIONS;
  const onClick = () => {
    defRulesDispatch(DefineRulesViewState.action.setEntrySelection(ITERATIONS));
    location.hash = "#DefineRulesetGeneratorProgramIterations";
  };
  const isSelected = viewState.entrySelection === ITERATIONS;
  return (
    <Item name="Iterations" onClick={onClick}
        isSelected={isSelected} errors={errors} />
  );
}

function PairwiseProgramItem(props: {
  viewState: DefineRulesViewState,
  errors: ShasmParseError[] | undefined,
}) {
  const { viewState, errors } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Pairwise Program"
        entrySelection={DefineRulesGeneratorProgramSection.PAIRWISE_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramPairwiseProgram"}
        errors={errors} />
  );
}

function MergeProgramItem(props: {
  viewState: DefineRulesViewState,
  errors: ShasmParseError[] | undefined,
}) {
  const { viewState } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Merge Program"
        entrySelection={DefineRulesGeneratorProgramSection.MERGE_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramMergeProgram"}
        errors={props.errors} />
  );
}

function FinalProgramItem(props: {
  viewState: DefineRulesViewState,
  errors: ShasmParseError[] | undefined,
}) {
  const { viewState, errors } = props;
  return (
    <ProgramItem viewState={viewState}
        name="Final Program"
        entrySelection={DefineRulesGeneratorProgramSection.FINAL_PROGRAM}
        elementId={"DefineRulesetGeneratorProgramFinalProgram"}
        errors={errors} />
  );
}

function ProgramItem(props: {
  viewState: DefineRulesViewState,
  name: string,
  entrySelection: DefineRulesEntrySelection,
  elementId: string,
  errors?: ShasmParseError[] | undefined,
}) {
  const { viewState, name, entrySelection, elementId } = props;
  const errors = (props.errors || []).map(e => `line ${e.lineNo + 1}: ${e.message}`);
  const defRulesDispatch = useAppDispatch.view.connected.defRules();
  const onClick = () => {
    defRulesDispatch(
      DefineRulesViewState.action.setEntrySelection(entrySelection)
    );
    location.hash = `#${elementId}`;
  };
  const isSelected = viewState.entrySelection === entrySelection;
  return (
    <Item name={name} onClick={onClick} isSelected={isSelected} errors={errors} />
  );
}


function Item(props: {
  name: string,
  onClick: () => void,
  isSelected: boolean,
  errors?: string[] | undefined,
}) {
  const { name, onClick } = props;
  const errors = props.errors || [];
  const UseTypography =
    props.isSelected
      ? SelectedItemTypography
      : ItemTypography;
  return (
    <UseTypography variant="h5" color={"primary.dark"} onClick={onClick}
      position={"relative"}>
      {name}
      {
        errors.length > 0 ?
          (
            <span
                style={{
                    float: "right",
                    position: "absolute",
                    right: "0",
                    top: "-0.5rem"
                }}
            >
              <ValidationErrors errors={errors}
                  exclaimSx={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    filter: "brightness(1.5)",
                  }}/>
            </span>
          )
          : null
      }
    </UseTypography>
  );
}

function ItemList(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <Box display="flex" flexDirection="column" flex="0"
        minHeight="5rem"
        minWidth="20rem"
        margin="1rem 0rem auto 1rem" width="auto" height="auto"
        padding="1rem 0rem 1rem 0.5rem"
        border="2px dotted #622" borderRadius="2rem"
        fontSize="1.5rem" color="#622"
        position="sticky" top="1rem"
        sx={{ textAlign: "right" }}>
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

function FieldList(props: {
  viewState: DefineRulesViewState,
  fields: Record<string, {
    selection: DefineRulesEntrySelection,
    label: string,
    node: React.ReactNode,
  }>,
}) {
  const { viewState, fields } = props;
  const dispatch = useAppDispatch.view.connected.defRules();
  const entries = Object.entries(fields);
  return (
    <Box display="flex" flexDirection="column" flex="1"
        width="auto" fontSize="1.5rem" color="#622" textAlign="left"
        margin="0" padding="0 1rem 0 1rem">
      {entries.map(([id, { selection, label, node }], index) => {
        const curSelection = viewState.entrySelection;
        const selected =
          curSelection
            ?  DefineRulesEntrySelection.mapToId(curSelection) === id
            : false;
        const headerTextColor = selected ? "#622" : "#caa";
        const headerTextBg = selected ? "#caa" : "#622";
        const border = selected ? "2px solid #caa" : "2px solid #622";
        const onClick = () => {
          dispatch(DefineRulesViewState.action.setEntrySelection(selection));
        };
        return (
          <Box margin="4rem 0 0 0" padding="0" key={index}
            display="flex" flexDirection="column">
            <Typography variant="h5" color="#622"
              margin="0 auto 0 4rem" padding="0.5rem 2rem"
              borderRadius={"1rem 1rem 0 0"} id={id}
              onClick={onClick}
              fontWeight={700}
              sx={{
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
          </Box>
        );
      })}
    </Box>
  );
}

function FormatEntry(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
  const dialogState = viewState.addFormatWordDialog;
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
      <AddFormatWordDialog
          visible={dialogState.visible} viewState={viewState} />
    </>
  );
}

function FormatWordList(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const formatInputState = viewState.format;
  return (
    <Box display="flex" flexDirection="column"
      margin="0 auto 0 1rem" padding="2rem"
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
  viewState: GeneratorProgramViewState,
  index: number,
  name: string,
}) {
  const { viewState, index, name } = props;
  const formatInput = viewState.format;
  const dialogState = viewState.addFormatComponentDialog;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
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
      <AddFormatComponentDialog viewState={viewState}
          wordIndex={index} visible={dialogState.visible} />
    </Box>
  );
}

function InitProgramEntry(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const programText = viewState.initProgram;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
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

function IterationsEntry(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const iterations = viewState.iterations;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
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

function PairwiseProgramEntry(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const programText = viewState.pairwiseProgram;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
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

function MergeProgramEntry(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const programText = viewState.mergeProgram;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
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

function FinalProgramEntry(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const programText = viewState.finalProgram;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
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
