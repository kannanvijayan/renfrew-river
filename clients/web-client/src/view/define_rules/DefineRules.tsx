import { Box, Divider, styled, Typography } from "@mui/material";
import Sidebar from "./Sidebar";
import PerlinEdit from "./PerlinEdit";
import GeneratorProgramEdit from "./GeneratorProgramEdit";
import DefineRulesViewState from "../../state/view/define_rules";
import { useAppDispatch, useAppListener } from "../../store/hooks";
import Session from "../../session/session";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";

const DefineRulesBox = styled(Box)({
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

export default function DefineRules(props: {
  viewState: DefineRulesViewState | null,
}) {
  const { viewState } = props;

  useAppListener.view.connected.defineRules((newDefRules, oldDefRules) => {
    if (newDefRules?.terrainGeneration !== oldDefRules?.terrainGeneration) {
      console.log("DefineRulesetMain: new rules");
      const session = Session.getInstance();
      session.defRules.view.bumpValidationTimeout();
    }
  });

  if (!viewState) {
    console.warn("DefineRulesetMain: viewState is null");
    return;
  }

  return (
    <DefineRulesBox sx={{
      backgroundColor: "primary.dark",
    }}>
      <Title />
      <Divider sx={{
        backgroundColor: "secondary.main",
        height: "2px",
        width: "100%",
        margin: 0,
      }}/>
      <Contents viewState={viewState} />
    </DefineRulesBox>
  )
}

function Title() {
  const dispatchConnected = useAppDispatch.view.connected();
  const onBackClicked = async () => {
    const session = Session.getInstance();
    await session.defRules.leave();
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.MAIN_MENU
    ));
  };
  return (
    <Typography variant="h1" color={"primary.contrastText"} position="relative"
        sx={{ margin: 0, flex: 0 }}>
      <Typography display="block" position="absolute" fontSize="5rem" left="2rem"
          onClick={onBackClicked}
          sx={{
            float: "left",
            filter: "brightness(3)",
            "&:hover": { textShadow: "0 0 0.05rem #ccaa66" },
            }}>
        🔙
      </Typography>
      Define Ruleset
    </Typography>
  )
}

function Contents(props: { viewState: DefineRulesViewState }) {
  const { viewState } = props;
  return (
    <Box display="flex" flexDirection="row" flex={1}
        sx={{
          minHeight: "5rem",
          width: "100%", margin: 0, padding: 0,
          backgroundColor: "secondary.dark",
          borderRadius: "0 0 2.5rem 2.5rem",
        }}>
      <Sidebar viewState={viewState} />
      <Divider orientation="vertical" flexItem sx={{
        backgroundColor: "secondary.main",
        width: "2px",
        height: "100%",
        margin: 0,
      }}/>
      <Editor viewState={viewState} />
    </Box>
  )
}

function Editor(props: { viewState: DefineRulesViewState }) {
  const { viewState } = props;
  if (viewState.category === "terrain_gen/perlin_rules") {
    return <PerlinEdit viewState={viewState} />
  }
  if (viewState.category === "terrain_gen/generator_program") {
    return <GeneratorProgramEdit viewState={viewState} />
  }
  return <Box width="100%" height="100%" />
}
