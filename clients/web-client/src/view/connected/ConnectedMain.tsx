import ConnectedViewState from "../../state/view/connected_view";
import DefineRulesetMain from "../ruleset/DefineRulesetMain";
import TopBar from "../TopBar";
import MainMenu from "./MainMenu";

export default function ConnectedMain(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  return (
    <>
      <TopBar viewState={viewState} />
      <MainContent viewState={viewState } />
    </>
  );
}

function MainContent(props: {
  viewState: ConnectedViewState,
}) {
  switch (props.viewState.viewMode) {
    case "main_menu":
      return (
        <MainMenu />
      );
    case "define_ruleset":
      return (
        <DefineRulesetMain viewState={props.viewState.defRules} />
      );
    default:
      console.error("Unknown view mode: " + props.viewState.viewMode);
      return (
        <></>
      );
  }
}
