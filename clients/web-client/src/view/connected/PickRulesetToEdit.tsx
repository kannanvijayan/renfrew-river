import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import { useAppDispatch } from "../../store/hooks";
import Session from "../../session/session";
import RulesetPicker from "../common/RulesetPicker";
import { RulesetEntry } from "renfrew-river-protocol-client";

export default function PickRulesetToEdit(props: {
  rulesetList: RulesetEntry[],
}) {
  const { rulesetList } = props;

  const dispatchConnected = useAppDispatch.view.connected();
  const onBackClicked = () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.MAIN_MENU
    ));
  };

  const onRulesetClicked = async (name: string) => {
    const session = Session.getInstance();
    await session.defineRules.enter();
    await session.defineRules.loadRules(name);
    await session.defineRules.view.syncRecvRulesetInput();
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.DEFINE_RULES
    ));
  };

  return (
    <RulesetPicker title="Edit Ruleset" onBackClicked={onBackClicked}
        onRulesetClicked={onRulesetClicked} rulesetList={rulesetList} />
  )
}
