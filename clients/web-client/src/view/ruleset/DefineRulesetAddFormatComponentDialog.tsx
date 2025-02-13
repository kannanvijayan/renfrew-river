import { Box, Button, Dialog, Input, styled, Typography }
  from "@mui/material";
import ConnectedViewState from "../../state/view/connected_view";
import { useRootDispatch } from "../../store/hooks";
import RootState from "../../state/root";
import ViewState from "../../state/view";
import GeneratorProgramViewState, { FormatInput } from "../../state/view/generator_program";

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

export default function DefineRulesetAddFormatComponentDialog(props: {
  viewState: ConnectedViewState,
  wordIndex: number,
  visible: boolean,
}) {
  const { viewState, wordIndex, visible } = props;
  const dispatch = useRootDispatch();
  const formatInputState = viewState.generatorProgram.formatInput;
  const dispatchFormatInputUpdate =
    (formatInputUpdate: Partial<FormatInput>) => {
      dispatch(RootState.action.view(
        ViewState.action.connected(
          ConnectedViewState.action.generatorProgram(
            GeneratorProgramViewState.action.setFormatInput({
              ...formatInputState,
              ...formatInputUpdate,
            })
          )
        )
      ));
    };
  const onNameChange = (value: string) => {
    console.log("onNameChange", value);
    dispatchFormatInputUpdate({
      addComponentDialog: {
        ...formatInputState.addComponentDialog,
        name: value,
      },
    });
  };
  const onStartBitChange = (value: string) => {
    console.log("onStartBitChange", value);
    dispatchFormatInputUpdate({
      addComponentDialog: {
        ...formatInputState.addComponentDialog,
        startBit: value,
      },
    });
  };
  const onNumBitsChange = (value: string) => {
    console.log("onNumBitsChange", value);
    dispatchFormatInputUpdate({
      addComponentDialog: {
        ...formatInputState.addComponentDialog,
        numBits: value,
      },
    });
  };
  const onAddClicked = () => {
    console.log("onAddClicked");
    dispatchFormatInputUpdate({
      wordFormats:
        formatInputState.wordFormats.map((wordFormat, index) => {
          if (index !== wordIndex) {
            return wordFormat;
          }
          return {
            ...wordFormat,
            components: [
              ...wordFormat.components,
              {
                name: formatInputState.addComponentDialog.name,
                startBit: formatInputState.addComponentDialog.startBit,
                numBits: formatInputState.addComponentDialog.numBits,
              }
            ],
          };
        }),
      addComponentDialog: {
        visible: false,
        name: "",
        startBit: "",
        numBits: "",
      },
    });
  };
  const nameInput = formatInputState.addComponentDialog.name;
  const startBitInput = formatInputState.addComponentDialog.startBit;
  const numBitsInput = formatInputState.addComponentDialog.numBits;
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
  viewState: ConnectedViewState,
  wordIndex: number,
}) {
  const { viewState, wordIndex } = props;
  const dispatch = useRootDispatch();
  const formatInput = viewState.generatorProgram.formatInput;
  const wordInfo = formatInput.wordFormats[wordIndex];

  const onCloseClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.generatorProgram(
          GeneratorProgramViewState.action.setFormatInput({
            ...formatInput,
            addComponentDialog: {
              ...formatInput.addComponentDialog,
              visible: false,
            },
          })
        )
      )
    ));
  };
  return (
    <Box display="flex" flexDirection="row" margin="0" padding="0"
      textAlign={"center"} width="100%">
      <CloseButton onClick={onCloseClick}>
        ❌
      </CloseButton>
      <Box display="flex" flexDirection="column" margin="auto" padding="0">
        <Typography className="AddComponentDialogTitle" variant="h2"
            color={"primary.contrastText"} fontSize={"3rem"}
            sx={{ margin: "1rem auto 0 auto", width: "100%" }}>
          Add Component
        </Typography>
        <Typography className="AddComponentDialogSubtitle" variant="h3"
            color={"primary.contrastText"} fontSize={"2rem"}
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
