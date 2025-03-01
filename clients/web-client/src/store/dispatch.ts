
import RootState, { RootAction } from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import ConnectedViewState, { ConnectedViewAction } from "../state/view/connected_view";
import { CreateWorldAction } from "../state/view/create_world/create_world";
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

export const dispatchApp = functionObject(dispatchRoot, {
  view: functionObject(dispatchView, {
    unconnected: dispatchUnconnectedView,
    connected: functionObject(dispatchConnectedView, {
      defineRules: dispatchDefineRulesView,
      createWorld: dispatchCreateWorldView,
    }),
  }),
});
