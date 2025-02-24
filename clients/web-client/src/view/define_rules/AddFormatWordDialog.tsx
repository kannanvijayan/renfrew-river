import { Box, Button, Dialog, Input, styled, Typography }
  from "@mui/material";
import { useAppDispatch } from "../../store/hooks";
import GeneratorProgramViewState from "../../state/view/def_rules/generator_program";

const StyledDialog = styled(Dialog)({
  margin: 0,
  padding: 0,
  width: "auto",
  height: "auto",
  maxWidth: "100%",
});

const AddWordDialogBox = styled(Box)({
  display: "flex",
  flexDirection: "column",
  textAlign: "center",
  margin: 0,
  borderRadius: "2.5rem 2.5rem 0 0",
  padding: 0,
  width: "100%",
  alignItems: "center",
});

export default function AddFormatWordDialog(props: {
  viewState: GeneratorProgramViewState,
  visible: boolean,
}) {
  const { viewState, visible } = props;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.terrainGeneration.generatorProgram();
  const formatState = viewState.format;
  const dialogState = viewState.addFormatWordDialog;
  const onNameChange = (value: string) => {
    console.log("onNameChange", value);
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatWordDialog({
        ...dialogState,
        name: value,
      })
    );
  };
  const onAddClicked = () => {
    console.log("onAddClicked");
    dispatchGeneratorProgram(GeneratorProgramViewState.action.setFormat({
      ...formatState,
      wordFormats: [
        ...formatState.wordFormats,
        { name: dialogState.name, components: [] }
      ],
    }));
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatWordDialog({
        visible: false,
        name: "",
      })
    );
  };
  const nameInput = dialogState.name;
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
      <AddWordDialogBox sx={{ backgroundColor: "primary.dark" }}>
        <AddWordDialogTitle viewState={viewState} />
        <Box display="flex" flexDirection="column"
            margin="0" padding="1rem 0 0 0" width="100%"
            sx={{ backgroundColor: "secondary.dark" }}>
          <AddWordDialogInput name="Name" value={nameInput}
              onChange={onNameChange} />
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
      </AddWordDialogBox>
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

function AddWordDialogTitle(props: { viewState: GeneratorProgramViewState }) {
  const { viewState } = props;
  const dispatchGeneratorProgram =
    useAppDispatch.view.connected.defRules.terrainGeneration.generatorProgram();
  const dialogState = viewState.addFormatWordDialog;
  const onCloseClick = () => {
    dispatchGeneratorProgram(
      GeneratorProgramViewState.action.setAddFormatWordDialog({
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
      <Typography className="AddWordDialogTitle" variant="h2"
        color={"primary.contrastText"}
        sx={{ margin: "1rem", textAlign: "center", width: "100%" }}>
        Add Word
      </Typography>
    </Box>
  )
}

function AddWordDialogInput(props: {
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
