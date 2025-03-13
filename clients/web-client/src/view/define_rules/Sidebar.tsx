import { Box, Button, Container, Input, styled, Typography } from "@mui/material";
import {
  RulesetValidation,
  TerrainGenValidation,
} from "renfrew-river-protocol-client";

import Application from "../../application";
import ValidationErrors from "../common/ValidationErrors";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import DefineRulesViewState from "../../state/view/define_rules/define_rules";
import { useAppDispatch } from "../../store/hooks";

export default function Sidebar(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  const updateExisting = viewState.updateExisting;
  return (
    <Box display="flex" flexDirection="column"
        width="40rem" textAlign="left" margin={0} padding={0}
        sx={{ borderRadius: "0 0 0 3rem", border: 0 }}>
      <NameAndDescription viewState={viewState} />
      <TerrainGen viewState={viewState} />
      <SidebarValidation validation={viewState.validation}
        updateExisting={updateExisting}/>
    </Box>
  )
}

function NameAndDescription(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  const { name, description } = viewState;
  const nameErrors = viewState.validation?.name || [];
  const descriptionErrors = viewState.validation?.description || [];

  const dispatchDefineRules = useAppDispatch.view.connected.defRules();

  const onNameChange = (value: string) => {
    const session = Application.getInstance().getSession();
    dispatchDefineRules(DefineRulesViewState.action.setName(value));
    session.defineRules.view.bumpValidationTimeout();
  };

  const onDescriptionChange = (value: string) => {
    const session = Application.getInstance().getSession();
    dispatchDefineRules(DefineRulesViewState.action.setDescription(value));
    session.defineRules.view.bumpValidationTimeout();
  }

  return (
    <Box display="flex" flexDirection="column" margin="0 1rem 1rem 0" padding="0">
      <NameOrDescrInput label="Name" value={name}
          onChange={onNameChange} errors={nameErrors} />
      <NameOrDescrInput label="Description" value={description}
          onChange={onDescriptionChange} errors={descriptionErrors} />
    </Box>
  );
}

function NameOrDescrInput(props: {
  label: string,
  value: string,
  onChange: (value: string) => void,
  errors: string[],
}) {
  const { label, value, onChange, errors } = props;
  return (
    <Box display="flex" flexDirection="column" margin="2rem 1rem 1rem 2rem"
        padding="0 1rem 0 0" width="95%" textAlign={"left"}>
      <Typography variant="h5" color={"primary.dark"} sx={{
        margin: "0 1rem 0 0",
        fontSize: "2.5rem",
        padding: "0",
      }}>
        {label}
        <NameDescrExclaim errors={errors} />
      </Typography>
      <Input value={value} sx={{ width: "100%", fontSize: "1.5rem" }}
        onChange={(e) => onChange(e.target.value)} />
    </Box>
  );
}

function TerrainGen(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  const terrainGenValidation = viewState.validation?.terrainGen;

  const dispatchDefineRules = useAppDispatch.view.connected.defRules();
  const onClickPerlinRules = () => {
    dispatchDefineRules(
      DefineRulesViewState.action.setCategory("terrain_gen/perlin_rules")
    );
  }
  const onClickGeneratorProgram = () => {
    dispatchDefineRules(
      DefineRulesViewState.action.setCategory("terrain_gen/generator_program")
    );
  }

  return (
    <Category categoryName="Terrain Generation"
        validation={terrainGenValidation}>
      <Entry viewState={viewState}
          entryName="Perlin Rules"
          entryId="terrain_gen/perlin_rules"
          onClick={onClickPerlinRules}
          errors={terrainGenValidation?.perlin?.errors} />
      <Entry viewState={viewState}
          entryName="Generator Program" entryId="terrain_gen/generator_program"
          onClick={onClickGeneratorProgram}
          errors={terrainGenValidation?.stage?.errors} />
    </Category>
  )
}

function Category(props: {
  categoryName: string,
  validation?: TerrainGenValidation,
  children?: React.ReactNode,
}) {
  const { categoryName, validation, children } = props;

  const errors = validation?.errors || [];
  return (
    <Box display="flex" flexDirection="column"
      margin="0" width="auto">
      <Container
          sx={{
            margin:"0 0 1rem 0",
            padding:"0 1rem 0 0",
            backgroundColor: "secondary.main",
            alignContent: "begin",
          }}>
        <Typography variant="h3" color={"secondary.contrastText"} sx={{
          fontSize: "2.5rem",
          padding: "1rem",
        }}>
          <span style={{float: "left"}}>
            {categoryName}
          </span>
          <span style={{float: "left"}}>
            <CategoryValidation errors={errors} />
          </span>
        </Typography>
      </Container>
      <Box display="flex" flexDirection="column" margin="0" padding="0"
        textAlign="right">
        {children}
      </Box>
    </Box>
  );
}
function CategoryValidation(props: {
  errors: string[],
}) {
  const { errors } = props;
  const exclaimSx = {
    fontSize: "2rem",
    margin: "0 auto 0 1rem",
    padding: "0",
    float: "left",
    position: "absolute",
    display: "block",
  };
  if (errors.length == 0) {
    return;
  }

  return (
    <div style={{margin:"0", padding:"0", float: "left"}}>
      <ValidationErrors errors={errors} exclaimSx={exclaimSx} />
    </div>
  );
}


const EntryTypography = styled(Typography)({
  margin: "0.5rem 1rem 0.5rem 1rem",
  fontWeight: "bolder",
  fontSize: "2rem",
  color: "#622",
  padding: "0.5rem 1rem 0.5rem 0",
  "&:hover": {
    cursor: "pointer",
    textShadow: "0 0 0.5rem #ccaa66",
  }
});

const EntrySelectedTypography =
  styled(EntryTypography)({
    backgroundColor: "#622",
    color: "#ecc",
    "&:hover": {
      cursor: "pointer",
      textShadow: "0 0 0",
    }
  });

function Entry(props: {
  viewState: DefineRulesViewState,
  entryId: string,
  entryName: string,
  onClick: () => void,
  errors?: string[],
}) {
  const { viewState, entryId, entryName, onClick } = props;
  const errors = props.errors || [];
  const selected = viewState.category === entryId;
  const TypographyComponent =
    selected
      ? EntrySelectedTypography
      : EntryTypography;

  return (
    <TypographyComponent variant="h4" borderRadius={"1rem"} onClick={onClick}>
      <span style={{float: "right", padding: "0 0 0 1.5rem", margin: "0"}}>
        {entryName}
      </span>
      <span style={{float: "right", margin: "0 2rem 0 0"}}>
        <EntryValidation errors={errors} />
      </span>
    </TypographyComponent>
  );
}

function EntryValidation(props: {
  errors: string[],
}) {
  const { errors } = props;
  const exclaimSx = {
    fontSize: "1.5rem",
    margin: "0 auto 0 1rem",
    padding: "0",
    float: "left",
    position: "absolute",
    display: "block",
    filter: "brightness(1.2)",
  };

  if (errors.length == 0) {
    return;
  }
  return (
    <div style={{margin:"0", padding:"0", float: "left"}}>
      <ValidationErrors errors={errors} exclaimSx={exclaimSx} />
    </div>
  );
}

function SidebarValidation(props: {
  updateExisting: string | null,
  validation: RulesetValidation | null,
}) {
  const { validation, updateExisting } = props;
  const enabled = !validation;
  const errors = validation ? validation.errors : [];
  const exclaimSx = {
    fontSize: "2.5rem",
    margin: "0 0 0 0",
    padding: "1rem",
    float: "left",
    position: "absolute",
    display: "block",
  };
  return (
    <Box display="flex" flexDirection="column" flex="1" height="100%">
      <Box display="flex" flexDirection="row" m="auto 0 0 0"
          p="0 1rem 1rem 1rem"
          width="100%">
        {
          !enabled ?
            <ValidationErrors errors={errors} exclaimSx={exclaimSx} />
          : undefined
        }
        <CreateButton updateExisting={updateExisting} enabled={enabled} />
      </Box>
    </Box>
  );
}

function CreateButton(props: {
  updateExisting: string | null,
  enabled: boolean,
}) {
  const { enabled, updateExisting } = props;
  const text = updateExisting ? "Update" : "Create";

  const dispatchConnected = useAppDispatch.view.connected();

  const onClick = async () => {
    const session = Application.getInstance().getSession();
    try {
      await session.defineRules.saveRules();
      await session.retrieveRulesetList();
    } catch (e) {
      console.error("Failed to save rules", e);
      return;
    }

    try {
      await session.defineRules.leave();
    } catch (e) {
      console.error("Failed to leave define_rules mode.", e);
      return;
    }

    dispatchConnected(
      ConnectedViewState.action.setViewMode(ConnectedViewMode.MAIN_MENU)
    );
  };

  return (
    <Button variant="contained" color="success"
      sx={{
        margin: "auto auto 1rem auto",
        padding: "1rem",
        fontSize: "2rem",
      }}
      onClick={onClick}
      disabled={!enabled}>
      {text}
    </Button>
  );
}

function NameDescrExclaim(props: {
  errors: string[],
}) {
  const { errors } = props;
  const enabled = errors.length > 0;
  const exclaimSx = { fontSize: "1.5rem" };
  return enabled
    ? (
      <span style={{ float: "right", position: "absolute" }}>
        <ValidationErrors errors={errors} exclaimSx={exclaimSx} />
      </span>
    )
    : undefined;
}
