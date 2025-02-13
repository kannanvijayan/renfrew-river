import { Box, styled, Typography } from "@mui/material";
import ConnectedViewState from "../../state/view/connected_view";
import { useRootDispatch } from "../../store/hooks";
import RootState from "../../state/root";
import ViewState from "../../state/view";

export default function DefineRulesetSidebar(props: {
  viewState: ConnectedViewState,
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
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;

  const dispatch = useRootDispatch();
  const onClickPerlinRules = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesSelection("terrain_gen/perlin_rules")
      )
    ));
  }
  const onClickGeneratorProgram = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesSelection(
          "terrain_gen/generator_program"
        )
      )
    ));
  }

  return (
    <DefineRulesetSidebarCategory viewState={viewState}
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
  viewState: ConnectedViewState,
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
  viewState: ConnectedViewState,
  entryId: string,
  entryName: string,
  onClick: () => void,
}) {
  const { viewState, entryId, entryName, onClick } = props;
  const selected = viewState.defRulesSelection === entryId;
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
