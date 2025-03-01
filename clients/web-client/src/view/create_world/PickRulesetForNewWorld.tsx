import { RulesetEntry } from "renfrew-river-protocol-client";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import { useAppDispatch } from "../../store/hooks";
import RulesetPicker from "../common/RulesetPicker";
import CreateWorldViewState from "../../state/view/create_world/create_world";

export default function PickRulesetForNewWorld(props: {
  createWorldState: CreateWorldViewState,
  rulesetList: RulesetEntry[],
}) {
  const { createWorldState, rulesetList } = props;
  const dispatchConnected = useAppDispatch.view.connected();
  const dispatchCreateWorld = useAppDispatch.view.connected.createWorld();
  const onBackClicked = () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.MAIN_MENU
    ));
  };

  const onRulesetClicked = async (name: string) => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.CREATE_WORLD
    ));
    dispatchCreateWorld(CreateWorldViewState.action.setDescriptor({
      ...createWorldState.descriptor!,
      rulesetName: name,
    }));
  };

  return (
    <RulesetPicker title="Use Ruleset" onBackClicked={onBackClicked}
        onRulesetClicked={onRulesetClicked}
        rulesetList={rulesetList} />
  );
}
