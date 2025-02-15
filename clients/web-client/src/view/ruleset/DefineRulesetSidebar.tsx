import { Box, styled, Typography } from "@mui/material";
import { useAppDispatch } from "../../store/hooks";
import DefRulesViewState from "../../state/view/def_rules";

export default function DefineRulesetSidebar(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  return (
    <Box className="DefineRulesetSidebar"
      display="flex" flexDirection="column"
      width="40rem" textAlign="left" margin={0} padding={0}
      sx={{ borderRadius: "0 0 0 3rem", border: 0 }}>
      <DefineRulesetSidebarWorldGen viewState={viewState} />
    </Box>
  )
}

function DefineRulesetSidebarWorldGen(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;

  const dispatchDefRules = useAppDispatch.view.connected.defRules();
  const onClickPerlinRules = () => {
    dispatchDefRules(
      DefRulesViewState.action.setCategory("terrain_gen/perlin_rules")
    );
  }
  const onClickGeneratorProgram = () => {
    dispatchDefRules(
      DefRulesViewState.action.setCategory("terrain_gen/generator_program")
    );
  }

  return (
    <DefineRulesetSidebarCategory 
        categoryName="Terrain Generation">
      <DefineRulesetSidebarEntry viewState={viewState}
          entryName="Perlin Rules" entryId="terrain_gen/perlin_rules"
          onClick={onClickPerlinRules} />
      <DefineRulesetSidebarEntry viewState={viewState}
          entryName="Generator Program" entryId="terrain_gen/generator_program"
          onClick={onClickGeneratorProgram} />
    </DefineRulesetSidebarCategory>
  )
}

function DefineRulesetSidebarCategory(props: {
  categoryName: string,
  children?: React.ReactNode,
}) {
  const { categoryName, children } = props;
  return (
    <Box className="DefineRulesetSidebarCategory" display="flex" flexDirection="column"
      margin="0" width="auto">
      <Typography variant="h3" color={"secondary.contrastText"} sx={{
        fontSize: "2.5rem",
        margin: "0 0 0 0",
        padding: "1rem",
        backgroundColor: "secondary.main",
      }}>
        {categoryName}
      </Typography>
      <Box display="flex" flexDirection="column" margin="0" padding="0"
        textAlign="right">
        {children}
      </Box>
    </Box>
  )
}

const DefineRulesetSidebarEntryTypography = styled(Typography)({
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

const DefineRulesetSidebarEntrySelectedTypography =
  styled(DefineRulesetSidebarEntryTypography)({
    backgroundColor: "#622",
    color: "#ecc",
    "&:hover": {
      cursor: "pointer",
      textShadow: "0 0 0",
    }
  });

function DefineRulesetSidebarEntry(props: {
  viewState: DefRulesViewState,
  entryId: string,
  entryName: string,
  onClick: () => void,
}) {
  const { viewState, entryId, entryName, onClick } = props;
  const selected = viewState.category === entryId;
  const TypographyComponent =
    selected
      ? DefineRulesetSidebarEntrySelectedTypography
      : DefineRulesetSidebarEntryTypography;

  return (
    <TypographyComponent variant="h4" borderRadius={"1rem"} onClick={onClick}>
      {entryName}
    </TypographyComponent>
  );
}
