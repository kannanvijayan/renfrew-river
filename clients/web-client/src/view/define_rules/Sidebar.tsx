import { Box, Button, Container, styled, Typography } from "@mui/material";
import { useAppDispatch } from "../../store/hooks";
import DefineRulesViewState from "../../state/view/def_rules";
import { RulesetValidation } from "renfrew-river-protocol-client/dist/types/ruleset";
import { ruleset } from "renfrew-river-protocol-client";
import ValidationErrors from "./ValidationErrors";

export default function Sidebar(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  return (
    <Box className="DefineRulesetSidebar"
      display="flex" flexDirection="column"
      width="40rem" textAlign="left" margin={0} padding={0}
      sx={{ borderRadius: "0 0 0 3rem", border: 0 }}>
      <TerrainGen viewState={viewState} />
      <SidebarValidation validation={viewState.validation} />
    </Box>
  )
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
  validation?: ruleset.TerrainGenValidation,
  children?: React.ReactNode,
}) {
  const { categoryName, validation, children } = props;

  const errors = validation?.errors || [];
  return (
    <Box className="DefineRulesetSidebarCategory" display="flex" flexDirection="column"
      margin="0" width="auto">
      <Container
          sx={{
            margin:0,
            padding:"0 1rem 0 0",
            backgroundColor: "secondary.main",
            alignContent: "begin",
          }}>
        <Typography variant="h3" color={"secondary.contrastText"} sx={{
          margin: "0 auto 0 0",
          fontSize: "2.5rem",
          padding: "1rem",
          width: "auto",
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
  validation: RulesetValidation | null,
}) {
  const { validation } = props;
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
    <Box className="DefineRulesetSidebarValidation"
         display="flex" flexDirection="column" flex="1" height="100%">
      <Box className="DefineRulesetSidebarValidationBottom"
          display="flex" flexDirection="row" m="auto 0 0 0"
          p="0 1rem 1rem 1rem"
          width="100%">
        {
          errors ?
            <ValidationErrors errors={errors} exclaimSx={exclaimSx} />
          : undefined
        }
        <CreateButton enabled={enabled} />
      </Box>
    </Box>
  );
}

function CreateButton(props: {
  enabled: boolean,
}) {
  const { enabled } = props;
  return (
    <Button variant="contained" color="success"
      sx={{
        margin: "auto auto 1rem auto",
        padding: "1rem",
        fontSize: "2rem",
      }}
      disabled={!enabled}>
      Create
    </Button>
  );
}
