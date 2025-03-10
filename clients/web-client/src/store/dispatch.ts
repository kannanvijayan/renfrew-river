
import RootState, { RootAction } from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import ConnectedViewState, { ConnectedViewAction } from "../state/view/connected_view";
import CreateWorldViewState, { CreateWorldAction } from "../state/view/create_world/create_world";
import { GeneratingWorldAction } from "../state/view/create_world/generating_world";
import { SpecifyDescriptorAction } from "../state/view/create_world/specify_descriptor";
import { DefineRulesAction } from "../state/view/define_rules/define_rules";
import { UnconnectedViewAction } from "../state/view/unconnected_view";
import { functionObject } from "../util/function_object";
import { store } from "./root";

function dispatchRoot(action: RootAction) {
  store.dispatch(action);
}

function dispatchView(viewAction: ViewAction) {
  dispatchRoot(RootState.action.view(viewAction));
}

function dispatchUnconnectedView(
  unconnectedViewAction: UnconnectedViewAction
) {
  dispatchView(ViewState.action.unconnected(unconnectedViewAction));
}

function dispatchConnectedView(
  connectedViewAction: ConnectedViewAction
) {
  dispatchView(ViewState.action.connected(connectedViewAction));
}

function dispatchDefineRulesView(
  defRulesAction: DefineRulesAction
) {
  dispatchConnectedView(
    ConnectedViewState.action.defineRules(defRulesAction)
  );
}

function dispatchCreateWorldView(
  createWorldAction: CreateWorldAction
) {
  dispatchConnectedView(
    ConnectedViewState.action.createWorld(createWorldAction)
  );
}

function dispatchSpecifyDescriptorView(
  specifyDescriptorAction: SpecifyDescriptorAction
) {
  dispatchCreateWorldView(
    CreateWorldViewState.action.specifyDescriptor(specifyDescriptorAction)
  );
}

function dispatchGeneratingWorldView(
  generatingWorldAction: GeneratingWorldAction
) {
  dispatchCreateWorldView(
    CreateWorldViewState.action.generatingWorld(generatingWorldAction)
  );
}

export const dispatchApp = functionObject(dispatchRoot, {
  view: functionObject(dispatchView, {
    unconnected: dispatchUnconnectedView,
    connected: functionObject(dispatchConnectedView, {
      defineRules: dispatchDefineRulesView,
      createWorld: functionObject(dispatchCreateWorldView, {
        specifyDescriptor: dispatchSpecifyDescriptorView,
        generatingWorld: dispatchGeneratingWorldView,
      }),
    }),
  }),
});
