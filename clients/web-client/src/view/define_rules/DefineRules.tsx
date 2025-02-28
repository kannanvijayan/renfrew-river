import { Box, Divider } from "@mui/material";
import Sidebar from "./Sidebar";
import PerlinEdit from "./PerlinEdit";
import GeneratorProgramEdit from "./GeneratorProgramEdit";
import DefineRulesViewState from "../../state/view/define_rules";
import { useAppDispatch, useAppListener } from "../../store/hooks";
import Session from "../../session/session";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import SecondStageFrame from "../common/SecondStageFrame";

export default function DefineRules(props: {
  viewState: DefineRulesViewState | null,
}) {
  const { viewState } = props;

  useAppListener.view.connected.defineRules((newDefRules, oldDefRules) => {
    if (newDefRules?.terrainGeneration !== oldDefRules?.terrainGeneration) {
      console.log("DefineRulesetMain: new rules");
      const session = Session.getInstance();
      session.defineRules.view.bumpValidationTimeout();
    }
  });

  const dispatchConnected = useAppDispatch.view.connected();
  const onBackClicked = async () => {
    const session = Session.getInstance();
    await session.defineRules.leave();
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.MAIN_MENU
    ));
  };

  if (!viewState) {
    console.warn("DefineRulesetMain: viewState is null");
    return;
  }

  return (
    <SecondStageFrame title="Define Rules" onBackClicked={onBackClicked}>
      <Contents viewState={viewState} />
    </SecondStageFrame>
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
