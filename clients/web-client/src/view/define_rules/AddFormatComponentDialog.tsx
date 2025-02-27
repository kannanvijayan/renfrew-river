import { Box, Button, Dialog, Input, styled, Typography }
  from "@mui/material";
import { useAppDispatch } from "../../store/hooks";
import GeneratorProgramViewState, { AddFormatWordComponentDialogState } from "../../state/view/define_rules/generator_program";

const useGeneratorProgramDispatch =
  useAppDispatch.view.connected.defRules.terrainGeneration.generatorProgram;

const StyledDialog = styled(Dialog)({
  margin: 0,
  padding: 0,
  width: "auto",
  height: "auto",
  maxWidth: "100%",
});

const AddComponentDialogBox = styled(Box)({
  display: "flex",
  flexDirection: "column",
  textAlign: "center",
  margin: 0,
  borderRadius: "2.5rem 2.5rem 0 0",
  padding: 0,
  width: "100%",
  alignItems: "center",
});

export default function AddFormatComponentDialog(props: {
  viewState: GeneratorProgramViewState,
  wordIndex: number,
  visible: boolean,
}) {
  const { viewState, wordIndex, visible } = props;
  const formatState = viewState.format;
  const dialogState = viewState.addFormatComponentDialog;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
  const dispatchDialogUpdate =
    (dialogUpdate: Partial<AddFormatWordComponentDialogState>) => {
      dispatchGeneratorProgram(
        GeneratorProgramViewState.action.setAddFormatComponentDialog({
          ...dialogState,
          ...dialogUpdate,
        }));
    };
  const onNameChange = (value: string) => {
    console.log("onNameChange", value);
    dispatchDialogUpdate({ name: value });
  };
  const onStartBitChange = (value: string) => {
    console.log("onStartBitChange", value);
    dispatchDialogUpdate({ startBit: value });
  };
  const onNumBitsChange = (value: string) => {
    console.log("onNumBitsChange", value);
    dispatchDialogUpdate({ numBits: value });
  };
  const onAddClicked = () => {
    console.log("onAddClicked");
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setFormat({
        wordFormats:
          formatState.wordFormats.map((wordFormat, index) => {
            if (index !== wordIndex) {
              return wordFormat;
            }
            return {
              ...wordFormat,
              components: [
                ...wordFormat.components,
                {
                  name: dialogState.name,
                  offset: dialogState.startBit,
                  bits: dialogState.numBits,
                }
              ],
            };
          }),
      })
    );
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatComponentDialog({
        visible: false,
        name: "",
        startBit: "",
        numBits: "",
      })
    );
  };
  const nameInput = dialogState.name;
  const startBitInput = dialogState.startBit;
  const numBitsInput = dialogState.numBits;
  return (
    <StyledDialog open={visible}
      slotProps={{
        backdrop: {
        },
        paper: {
          "sx": {
            backgroundColor: "secondary.dark",
            color: "#ecc",
            borderRadius: "3rem",
            border: "0.5em solid #ccaa66",
            padding: 0,
            width: "30%",
            maxWidth: "90%",
          },
        },
      }}>
      <AddComponentDialogBox sx={{ backgroundColor: "primary.dark" }}>
        <AddComponentDialogTitle viewState={viewState} wordIndex={wordIndex} />
        <Box display="flex" flexDirection="column"
          margin="0" padding="1rem 0 0 0" width="100%"
          sx={{ backgroundColor: "secondary.dark" }}>
          <AddComponentDialogInput name="Name" value={nameInput}
            onChange={onNameChange} />
          <AddComponentDialogInput name="Start Bit" value={startBitInput}
            onChange={onStartBitChange} />
          <AddComponentDialogInput name="Num Bits" value={numBitsInput}
            onChange={onNumBitsChange} />
          <Button variant="contained" size="large"
            onClick={onAddClicked}
            sx={{
              margin: "2rem auto 2rem auto",
              width: "50%",
              fontSize: "1.5rem",
            }}>
            Add
          </Button>
        </Box>
      </AddComponentDialogBox>
    </StyledDialog>
  );
}

const CloseButton = styled(Button)({
  display: "block",
  fontSize: "3rem",
  position: "absolute",
  margin: "0.5rem 0 0 1rem",
  "&:hover": {
    cursor: "pointer",
    textShadow: "0 0 0.5rem #ccaa66",
  },
});

const WordNumLabel = styled(Typography)({
  display: "block",
  float: "right",
  fontSize: "1.5rem",
  position: "absolute",
  margin: "1.5rem 0 0 auto",
  right: "2rem",
  "&:hover": {
    cursor: "pointer",
    textShadow: "0 0 0.5rem #ccaa66",
  },
});

function AddComponentDialogTitle(props: {
  viewState: GeneratorProgramViewState,
  wordIndex: number,
}) {
  const { viewState, wordIndex } = props;
  const dispatchGeneratorProgram = useGeneratorProgramDispatch();
  const formatState = viewState.format;
  const dialogState = viewState.addFormatComponentDialog;
  const wordInfo = formatState.wordFormats[wordIndex];

  const onCloseClick = () => {
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatComponentDialog({
        ...dialogState,
        visible: false,
      })
    );
  };
  return (
    <Box display="flex" flexDirection="row" margin="0" padding="0"
      textAlign={"center"} width="100%">
      <CloseButton onClick={onCloseClick}>
        ❌
      </CloseButton>
      <Box display="flex" flexDirection="column" margin="auto" padding="0">
        <Typography variant="h2" color={"primary.contrastText"} fontSize={"3rem"}
          sx={{ margin: "1rem auto 0 auto", width: "100%" }}>
          Add Component
        </Typography>
        <Typography variant="h3" color={"primary.contrastText"} fontSize={"2rem"}
          sx={{ margin: "1rem auto", textAlign: "center", width: "100%" }}>
          <span style={{ fontWeight: 700 }}>{wordInfo.name}</span>
        </Typography>
      </Box>
      <WordNumLabel>
        Word {wordIndex}
      </WordNumLabel>
    </Box>
  )
}

function AddComponentDialogInput(props: {
  name: string,
  value: string,
  onChange: (value: string) => void,
}) {
  const { name, value, onChange } = props;
  return (
    <Box display="flex" flexDirection="row" margin="1rem 0 0 0" padding="0"
      textAlign={"center"} width="100%">
      <Typography variant="h3" color={"primary.dark"}
        margin="0 1rem 0 0" padding="0" fontWeight={700}
        fontSize="2rem" width="20rem" textAlign="right">
        {name}
      </Typography>
      <Input onChange={(e) => onChange(e.target.value)}
        value={value}
        sx={{
          backgroundColor: "secondary.light",
          borderRadius: "0.5rem",
          height: "2rem",
          fontSize: "1.5rem",
          padding: "0 0.5rem",
          margin: 0,
        }} />
    </Box>
  );
}
