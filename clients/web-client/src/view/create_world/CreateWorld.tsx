import { Box, Button, Input, Typography } from "@mui/material";
import SecondStageFrame from "../common/SecondStageFrame";
import { ReactNode } from "react";
import { useAppDispatch } from "../../store/hooks";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import CreateWorldViewState from "../../state/view/create_world/create_world";

export default function CreateWorld(props: {
  viewState: CreateWorldViewState,
}) {
  const { viewState } = props;
  const descriptor = viewState.descriptor!;
  const { name, description, seed, dims, rulesetName } = descriptor;

  const dispatchCreateWorld = useAppDispatch.view.connected.createWorld();

  const onNameChange = (value: string) => {
    dispatchCreateWorld(CreateWorldViewState.action.setDescriptor({
      ...descriptor,
      name: value,
    }));
  };
  const onDescriptionChange = (value: string) => {
    dispatchCreateWorld(CreateWorldViewState.action.setDescriptor({
      ...descriptor,
      description: value,
    }));
  };
  const onSeedChange = (value: string) => {
    dispatchCreateWorld(CreateWorldViewState.action.setDescriptor({
      ...descriptor,
      seed: value,
    }));
  };
  const onWidthChange = (value: string) => {
    dispatchCreateWorld(CreateWorldViewState.action.setDescriptor({
      ...descriptor,
      dims: { ...dims, columns: value },
    }));
  };
  const onHeightChange = (value: string) => {
    dispatchCreateWorld(CreateWorldViewState.action.setDescriptor({
      ...descriptor,
      dims: { ...dims, rows: value },
    }));
  };

  return (
    <SecondStageFrame title="Create World" onBackClicked={()=>{}}
        frameSx={{ width: "80rem", height: "auto"}}>
      <Box display="flex" flexDirection="column" overflow="scroll"
        width="100%" height="100%" margin="0" paddingBottom="1rem" sx={{
          backgroundColor: "secondary.dark",
          borderRadius: "0 0 2.5rem 2.5rem",
        }}>
        <InputEntry name="Name" value={name} onChange={onNameChange} />
        <InputEntry name="Description" value={description}
            onChange={onDescriptionChange} />
        <InputEntry name="Seed" value={seed} onChange={onSeedChange} />
        <InputEntry name="Width" value={dims.columns} onChange={onWidthChange} />
        <InputEntry name="Height" value={dims.rows} onChange={onHeightChange} />
        <RulesetInput name={rulesetName} />
        {/* Create button */}
        <Box display="flex" flexDirection="row" margin="3rem 0"
          width="100%" sx={{ fontSize: "3rem"}}>
            <Button variant="contained" color="primary"
              sx={{
                margin: "auto",
                padding: "1rem 2rem",
                fontSize: "3rem",
                borderRadius: "1rem",
              }}>
              Create
            </Button>
        </Box>
      </Box>
    </SecondStageFrame>
  )
}

function InputEntry(props: {
  name: string,
  value: string,
  onChange?: (value: string) => void,
}) {
  const { name, value, onChange } = props;
  return (
    <Entry name={name}>
      <Input value={value} onChange={ev => onChange?.(ev.target.value)}
          sx={{
            backgroundColor: "secondary.light",
            borderRadius: "0.5rem",
            padding: "0 0.5rem",
            fontSize: "2rem",
            margin: "auto 0 auto 2rem",
          }} />
    </Entry>
  );
}

function RulesetInput(props: {
  name: string,
}) {
  const { name } = props;
  const dispatchConnected = useAppDispatch.view.connected();
  const onClick = () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.PICK_RULESET_FOR_CREATE_WORLD
    ));
  };
  const border = name === "" ? "0.2rem dotted #444" : "0.2rem solid #622";
  return (
    <Entry name="Ruleset">
      <Input value={name} disabled={true}  sx={{
        backgroundColor: "secondary.dark",
        borderRadius: "0.5rem",
        border,
        padding: "0 0.5rem",
        fontSize: "2rem",
        margin: "auto 0 auto 2rem",
      }} />
      <Button variant="contained" color="primary"
        onClick={onClick}
        sx={{
          margin: "auto auto auto 2rem",
          padding: "1rem 2rem",
          fontSize: "1rem",
        }}>
        Select
      </Button>
    </Entry>
  )
}

function Entry(props: {
  name: string,
  children: ReactNode,
}) {
  const { name, children } = props;
  return (
    <Box flexDirection="row" display="flex" margin="3rem 0"
      width="100%" sx={{ fontSize: "3rem"}}>
      <Typography variant="h3" color="#622" margin="auto 0"
          sx={{
            fontWeight: 700,
            fontSize: "3rem",
            width: "30rem",
            textAlign: "right"
            }}>
        {name}
      </Typography>
      {children}
    </Box>
  );
}
