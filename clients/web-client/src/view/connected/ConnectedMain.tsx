import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import DefineRules from "../define_rules/DefineRules";
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
    case ConnectedViewMode.MAIN_MENU:
      return (<MainMenu />);
    case ConnectedViewMode.DEFINE_RULES:
      return (<DefineRules viewState={props.viewState.defineRules} />);
    default:
      console.error("Unknown view mode: " + props.viewState.viewMode);
      return (
        <></>
      );
  }
}
