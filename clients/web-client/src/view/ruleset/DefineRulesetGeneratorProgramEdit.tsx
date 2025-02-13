import { Box, Button, Divider, Input, styled, Typography } from "@mui/material";
import ConnectedViewState from "../../state/view/connected_view";
import DefineRulesetEditorBox from "./DefineRulesetEditorBox";
import { useRootDispatch } from "../../store/hooks";
import RootState from "../../state/root";
import ViewState from "../../state/view";
import { DefRulesEntrySelection, DefRulesGeneratorProgramSection } from "../../state/view/def_rules";
import GeneratorProgramViewState from "../../state/view/generator_program";
import DefineRulesetAddFormatWordDialog from "./DefineRulesetAddFormatWordDialog";
import ShasmProgramInput from "../common/ShasmProgramInput";
import ShasmProgramErrors from "../common/ShasmProgramErrors";
import DefineRulesetAddFormatComponentDialog from "./DefineRulesetAddFormatComponentDialog";

export default function DefineRulesetGeneratorProgramEdit(props: {
  viewState: ConnectedViewState,
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

function FormatItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const FORMAT = DefRulesGeneratorProgramSection.FORMAT;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(FORMAT)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramFormat";
  };
  const isSelected = viewState.defRulesEntrySelection === FORMAT;
  return (
    <DefineRulesetGeneratorProgramItem name="Format" onClick={onClick}
        isSelected={isSelected}/>
  );
}

function InitProgramItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const INIT_PROGRAM = DefRulesGeneratorProgramSection.INIT_PROGRAM;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(INIT_PROGRAM)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramInitProgram";
  };
  const isSelected = viewState.defRulesEntrySelection === INIT_PROGRAM;
  return (
    <DefineRulesetGeneratorProgramItem name="Init Program" onClick={onClick}
        isSelected={isSelected} />
  );
}

function IterationsItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const ITERATIONS = DefRulesGeneratorProgramSection.ITERATIONS;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(ITERATIONS)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramIterations";
  };
  const isSelected = viewState.defRulesEntrySelection === ITERATIONS;
  return (
    <DefineRulesetGeneratorProgramItem name="Iterations" onClick={onClick}
        isSelected={isSelected} />
  );
}

function PairwiseProgramItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const PAIRWISE_PROGRAM = DefRulesGeneratorProgramSection.PAIRWISE_PROGRAM;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(PAIRWISE_PROGRAM)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramPairwiseProgram";
  };
  const isSelected = viewState.defRulesEntrySelection === PAIRWISE_PROGRAM;
  return (
    <DefineRulesetGeneratorProgramItem name="Pairwise Program" onClick={onClick}
        isSelected={isSelected} />
  );
}

function PairwiseOutRegsItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const PAIRWISE_OUTREGS = DefRulesGeneratorProgramSection.PAIRWISE_OUTREGS;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(PAIRWISE_OUTREGS)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramPairwiseOutRegs";
  };
  const isSelected = viewState.defRulesEntrySelection === PAIRWISE_OUTREGS;
  return (
    <DefineRulesetGeneratorProgramItem name="Pairwise OutRegs" onClick={onClick}
        isSelected={isSelected} />
  );
}

function MergeProgramItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const MERGE_PROGRAM = DefRulesGeneratorProgramSection.MERGE_PROGRAM;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(MERGE_PROGRAM)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramMergeProgram";
  };
  const isSelected = viewState.defRulesEntrySelection === MERGE_PROGRAM;
  return (
    <DefineRulesetGeneratorProgramItem name="Merge Program" onClick={onClick}
        isSelected={isSelected} />
  );
}

function FinalProgramItem(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const FINAL_PROGRAM = DefRulesGeneratorProgramSection.FINAL_PROGRAM;
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(FINAL_PROGRAM)
      )
    ));
    location.hash = "#DefineRulesetGeneratorProgramFinalProgram";
  };
  const isSelected = viewState.defRulesEntrySelection === FINAL_PROGRAM;
  return (
    <DefineRulesetGeneratorProgramItem name="Final Program" onClick={onClick}
        isSelected={isSelected} />
  );
}

function DefineRulesetGeneratorProgramItemList(props: {
  viewState: ConnectedViewState,
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

function DefineRulesetGeneratorProgramFieldList(props: {
  viewState: ConnectedViewState,
  fields: Record<string, {
    selection: DefRulesEntrySelection,
    label: string,
    node: React.ReactNode,
  }>,
}) {
  const { viewState, fields } = props;
  const dispatch = useRootDispatch();
  const entries = Object.entries(fields);
  return (
    <Box className="DefineRulesetGeneratorProgramFieldList"
        display="flex" flexDirection="column" flex="1"
        width="auto" fontSize="1.5rem" color="#622" textAlign="left"
        margin="0" padding="0 1rem 0 1rem">
      {entries.map(([id, { selection, label, node }], index) => {
        const curSelection = viewState.defRulesEntrySelection;
        const selected =
          curSelection
            ?  DefRulesEntrySelection.mapToId(curSelection) === id
            : false;
        const headerTextColor = selected ? "#622" : "#caa";
        const headerTextBg = selected ? "#caa" : "#622";
        const border = selected ? "2px solid #caa" : "2px solid #622";
        const onClick = () => {
          dispatch(RootState.action.view(
            ViewState.action.connected(
              ConnectedViewState.action.setDefRulesEntrySelection(selection)
            )
          ));
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

function FormatEntry(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const formatInputState = viewState.generatorProgram.formatInput;
  const onAddWordClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setFormatInput({
            ...formatInputState,
            addWordDialog: {
              ...formatInputState.addWordDialog,
              visible: true,
            },
          })
        )
      )
    ));
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
          visible={formatInputState.addWordDialog.visible} viewState={viewState} />
    </>
  );
}

function FormatWordList(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const formatInputState = viewState.generatorProgram.formatInput;
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
  viewState: ConnectedViewState,
  index: number,
  name: string,
}) {
  const { viewState, index, name } = props;
  const formatInput = viewState.generatorProgram.formatInput;
  const dialogVisible = formatInput.addComponentDialog.visible;
  const dispatch = useRootDispatch();
  const onAddComponentClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setFormatInput({
            ...formatInput,
            addComponentDialog: {
              ...formatInput.addComponentDialog,
              visible: true,
            },
          })
        )
      )
    ));
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
            if (/^\d+$/.test(component.startBit)) {
              startBit = parseInt(component.startBit);
            }
            let endBit: number | undefined = undefined;
            if (/^\d+$/.test(component.numBits)) {
              const numBits = parseInt(component.numBits);
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
                  ({component.numBits} bits)
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
          wordIndex={index} visible={dialogVisible} />
    </Box>
  );
}

function InitProgramEntry(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.initProgramInput;
  const dispatch = useRootDispatch();
  const onChange = (programText: string) => {
    console.log("InitProgramEntry.onChange", programText);
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setInitProgramInput(programText)
        )
      )
    ));
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}

function IterationsEntry(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const iterations = viewState.generatorProgram.iterationsInput;
  const dispatch = useRootDispatch();
  const onChange = (iterations: string) => {
    console.log("IterationsEntry.onChange", iterations);
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setIterationsInput(iterations)
        )
      )
    ));
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

function PairwiseProgramEntry(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.pairwiseProgramInput;
  const dispatch = useRootDispatch();
  const onChange = (programText: string) => {
    console.log("PairwiseProgramEntry.onChange", programText);
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setPairwiseProgramInput(programText)
        )
      )
    ));
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}

function MergeProgramEntry(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.mergeProgramInput;
  const dispatch = useRootDispatch();
  const onChange = (programText: string) => {
    console.log("MergeProgramEntry.onChange", programText);
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setMergeProgramInput(programText)
        )
      )
    ));
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}

function FinalProgramEntry(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const programText = viewState.generatorProgram.finalProgramInput;
  const dispatch = useRootDispatch();
  const onChange = (programText: string) => {
    console.log("FinalProgramEntry.onChange", programText);
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setFinalProgramInput(programText)
        )
      )
    ));
  };
  return (
    <Box display="flex" flexDirection="row" margin="0 1rem" padding="0">
      <ShasmProgramInput programText={programText} onChange={onChange} />
      <ShasmProgramErrors />
    </Box>
  );
}
