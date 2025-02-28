import SessionState from "../../state/session";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import DefineRules from "../define_rules/DefineRules";
import TopBar from "../TopBar";
import PickRulesetToEdit from "./PickRulesetToEdit";
import MainMenu from "./MainMenu";

export default function ConnectedMain(props: {
  viewState: ConnectedViewState,
  sessionState: SessionState,
}) {
  const { viewState, sessionState } = props;
  return (
    <>
      <TopBar viewState={viewState} />
      <MainContent viewState={viewState} sessionState={sessionState} />
    </>
  );
}

function MainContent(props: {
  viewState: ConnectedViewState,
  sessionState: SessionState,
}) {
  const { viewState, sessionState } = props;
  switch (viewState.viewMode) {
    case ConnectedViewMode.MAIN_MENU:
      return (<MainMenu sessionState={sessionState} />);
    case ConnectedViewMode.DEFINE_RULES:
      return (<DefineRules viewState={viewState.defineRules} />);
    case ConnectedViewMode.PICK_RULESET_TO_EDIT:
      return (<PickRulesetToEdit sessionState={sessionState} />)
    default:
      console.error("Unknown view mode: " + viewState.viewMode);
      return (<></>);
  }
}


