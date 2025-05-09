import { RulesetEntry } from "renfrew-river-protocol-client";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import { useAppDispatch, useAppListener } from "../../store/hooks";
import RulesetPicker from "../common/RulesetPicker";
import SpecifyDescriptorViewState from "../../state/view/create_world/specify_descriptor";

export default function PickRulesetForNewWorld(props: {
  specifyDescriptorState: SpecifyDescriptorViewState,
  rulesetList: RulesetEntry[],
}) {
  const { specifyDescriptorState, rulesetList } = props;
  const { descriptor } = specifyDescriptorState;

  if (!descriptor) {
    console.error("PickRulesetForNewWorld: descriptor is null");
    return <></>;
  }

  useAppListener.view.connected.createWorld.watchDescriptorChange();

  const dispatchConnected = useAppDispatch.view.connected();
  const dispatchSpecifyDescriptor =
    useAppDispatch.view.connected.createWorld.specifyDescriptor();
  const onBackClicked = () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.MAIN_MENU
    ));
  };

  const onRulesetClicked = async (name: string) => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.CREATE_WORLD
    ));
    dispatchSpecifyDescriptor(SpecifyDescriptorViewState.action.setDescriptor({
      ...descriptor,
      rulesetName: name,
    }));
  };

  return (
    <RulesetPicker title="Use Ruleset" onBackClicked={onBackClicked}
        onRulesetClicked={onRulesetClicked}
        rulesetList={rulesetList} />
  );
}
