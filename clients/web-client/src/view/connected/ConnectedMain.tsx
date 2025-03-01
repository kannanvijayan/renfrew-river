import SessionState from "../../state/session";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import DefineRules from "../define_rules/DefineRules";
import TopBar from "../TopBar";
import PickRulesetToEdit from "./PickRulesetToEdit";
import MainMenu from "./MainMenu";
import CreateWorld from "../create_world/CreateWorld";
import PickRulesetForNewWorld from "../create_world/PickRulesetForNewWorld";

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
    case ConnectedViewMode.CREATE_WORLD:
      return (<CreateWorld viewState={viewState.createWorld!} />);
    case ConnectedViewMode.PICK_RULESET_TO_EDIT:
      return (<PickRulesetToEdit rulesetList={sessionState.rulesetList!} />);
    case ConnectedViewMode.PICK_RULESET_FOR_CREATE_WORLD: {
      if (
        viewState.createWorld &&
        ("SpecifyDescriptor" in viewState.createWorld!)
      ) {
        return (
          <PickRulesetForNewWorld rulesetList={sessionState.rulesetList!}
              specifyDescriptorState={viewState.createWorld!.SpecifyDescriptor} />
        );
      } else {
        console.error("Unexpected state for PICK_RULESET_FOR_CREATE_WORLD");
        return (<></>);
      }
    }
    default:
      console.error("Unknown view mode: " + viewState.viewMode);
      return (<></>);
  }
}


