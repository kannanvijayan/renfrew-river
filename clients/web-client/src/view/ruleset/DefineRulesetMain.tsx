import { Box, Divider, styled, Typography } from "@mui/material";
import ConnectedViewState from "../../state/view/connected_view";
import DefineRulesetSidebar from "./DefineRulesetSidebar";
import DefineRulesetPerlinEdit from "./DefineRulesetPerlinEdit";
import DefineRulesetGeneratorProgramEdit from "./DefineRulesetGeneratorProgramEdit";

const DefineRulesetBox = styled(Box)({
  display: "flex",
  flexDirection: "column",
  textAlign: "center",
  width: "75%",
  height: "75%",
  margin: "auto",
  borderRadius: "3rem",
  border: "0.5em solid #ccaa66",
  padding: "2rem 0 0 0",
});

export default function DefineRulesetMain(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  return (
    <DefineRulesetBox sx={{
      backgroundColor: "primary.dark",
    }}>
      <Title />
      <Divider sx={{
        backgroundColor: "secondary.main",
        height: "2px",
        width: "100%",
        margin: 0,
      }}/>
      <DefineRulesetContents viewState={viewState} />
    </DefineRulesetBox>
  )
}

function Title() {
  return (
    <Typography className="DefineRulesetTitle" variant="h1"
      color={"primary.contrastText"}
      sx={{ margin: 0, flex: 0 }}>
      Define Ruleset
    </Typography>
  )
}

function DefineRulesetContents(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  return (
    <Box className="DefineRulesetContents" display="flex" flexDirection="row"
      flex={1}
      sx={{
        minHeight: "5rem",
        width: "100%", margin: 0, padding: 0,
        backgroundColor: "secondary.dark",
        borderRadius: "0 0 2.5rem 2.5rem",
       }}>
      <DefineRulesetSidebar viewState={viewState} />
      <Divider orientation="vertical" flexItem sx={{
        backgroundColor: "secondary.main",
        width: "2px",
        height: "100%",
        margin: 0,
      }}/>
      <DefineRulesetEditor viewState={viewState} />
    </Box>
  )
}

function DefineRulesetEditor(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  if (viewState.defRulesSelection === "terrain_gen/perlin_rules") {
    return <DefineRulesetPerlinEdit viewState={viewState} />
  }
  if (viewState.defRulesSelection === "terrain_gen/generator_program") {
    return <DefineRulesetGeneratorProgramEdit viewState={viewState} />
  }
  return <Box width="100%" height="100%" />
}
