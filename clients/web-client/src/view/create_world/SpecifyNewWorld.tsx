import { Box, Button, Input, Typography } from "@mui/material";
import SecondStageFrame from "../common/SecondStageFrame";
import { ReactNode } from "react";
import { useAppDispatch, useAppListener } from "../../store/hooks";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import CreateWorldViewState, { SpecifyDescriptorViewState } from "../../state/view/create_world/create_world";
import Session from "../../session/session";
import { WorldDescriptorValidation } from "renfrew-river-protocol-client";
import ValidationErrors from "../common/ValidationErrors";

export default function SpecifyNewWorld(props: {
  viewState: SpecifyDescriptorViewState
}) {
  const { viewState } = props;
  const descriptor = viewState.descriptor!;
  const { name, description, seed, dims, rulesetName } = descriptor;

  const validation = viewState.validation;

  useAppListener.view.connected.createWorld.watchDescriptorChange();

  const dispatchCreateWorld = useAppDispatch.view.connected.createWorld();
  const onCreateClicked = async () => {
    const session = Session.getInstance();
    await session.createWorld.beginGeneration();
  };

  const onBackClicked = () => {
    const session = Session.getInstance();
    session.createWorld.leave();
  };

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

  const isValid =
    validation ? WorldDescriptorValidation.isValid(validation) : true;

  return (
    <SecondStageFrame title="Create World" onBackClicked={onBackClicked}
        frameSx={{ width: "80rem", height: "auto"}}>
      <Box display="flex" flexDirection="column" overflow="scroll"
        width="100%" height="100%" margin="0" paddingBottom="1rem" sx={{
          backgroundColor: "secondary.dark",
          borderRadius: "0 0 2.5rem 2.5rem",
        }}>
        <InputEntry name="Name" value={name}
            errors={validation?.name || []}
            onChange={onNameChange} />
        <InputEntry name="Description" value={description}
            errors={validation?.description || []}
            onChange={onDescriptionChange} />
        <InputEntry name="Seed" value={seed}
            errors={validation?.seed || []}
            onChange={onSeedChange} />
        <InputEntry name="Width" value={dims.columns}
            errors={validation?.dims.columns || []}
            onChange={onWidthChange} />
        <InputEntry name="Height" value={dims.rows}
            errors={validation?.dims.rows || []}
            onChange={onHeightChange} />
        <RulesetInput name={rulesetName}
            errors={validation?.rulesetName || []} />
        {/* Create button */}
        <Box display="flex" flexDirection="row" margin="3rem 0"
          width="100%" sx={{ fontSize: "3rem"}}>
            <Button variant="contained" color="primary"
              disabled={!isValid}
              onClick={onCreateClicked}
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
  errors: string[],
}) {
  const { name, value, onChange, errors } = props;
  return (
    <Entry name={name} errors={errors}>
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
  errors: string[],
}) {
  const { name, errors } = props;
  const dispatchConnected = useAppDispatch.view.connected();
  const onClick = () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.PICK_RULESET_FOR_CREATE_WORLD
    ));
  };
  const border = name === "" ? "0.2rem dotted #444" : "0.2rem solid #622";
  return (
    <Entry name="Ruleset" errors={errors}>
      <Input value={name} disabled={true}
          sx={{
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
  errors: string[],
}) {
  const { name, children, errors } = props;
  return (
    <Box flexDirection="row" display="flex" margin="3rem 0"
      width="100%" sx={{ fontSize: "3rem"}}>
      <Typography variant="h3" color="#622" margin="auto 0"
          sx={{
            fontWeight: 700,
            fontSize: "3rem",
            width: "30rem",
            textAlign: "right",
            position: "relative",
            }}>
        {name}
        {
          errors.length > 0 ? (
            <span
                style={{
                    float: "right",
                    position: "absolute",
                    right: "-1.5rem",
                    top: "-0.5rem"
                }}
            >
              <ValidationErrors errors={errors}
                  exclaimSx={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    filter: "brightness(1.5)",
                  }}/>
            </span>
          ) : null
        }
      </Typography>
      {children}
    </Box>
  );
}
