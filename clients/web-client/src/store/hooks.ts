import { useDispatch, useSelector, useStore } from "react-redux";

import RootState from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import { UnconnectedViewAction } from "../state/view/unconnected_view";
import ConnectedViewState, { ConnectedViewAction } from "../state/view/connected_view";
import { PerlinFieldsAction } from "../state/view/perlin_fields";
import { GeneratorProgramAction } from "../state/view/generator_program";

import type { RootDispatch, RootStore } from "./root";
import { functionObject } from "../util/function_object";

export const useRootDispatch = useDispatch.withTypes<RootDispatch>();
export const useRootSelector = useSelector.withTypes<RootState>();
export const useRootStore = useStore.withTypes<RootStore>();

export function useViewDispatch() {
  const dispatch = useRootDispatch();
  return (viewAction: ViewAction) => {
    dispatch(RootState.action.view(viewAction));
  }
}

export function useUnconnectedViewDispatch() {
  const dispatch = useRootDispatch();
  return (unconnectedViewAction: UnconnectedViewAction) => {
    dispatch(RootState.action.view(
      ViewState.action.unconnected(unconnectedViewAction)
    ));
  }
}

export function useConnectedViewDispatch() {
  const dispatch = useRootDispatch();
  return (connectedViewAction: ConnectedViewAction) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(connectedViewAction)
    ));
  }
}

export function useDefRulesPerlinFieldsDispatch() {
  const connectedViewDispatch = useConnectedViewDispatch();
  return (perlinFieldsAction: PerlinFieldsAction) => {
    connectedViewDispatch(
      ConnectedViewState.action.perlinFields(perlinFieldsAction)
    );
  }
}

export function useDefRulesGeneratorProgramDispatch() {
  const connectedViewDispatch = useConnectedViewDispatch();
  return (generatorProgramAction: GeneratorProgramAction) => {
    connectedViewDispatch(
      ConnectedViewState.action.generatorProgram(generatorProgramAction)
    );
  }
}

export const useAppDispatch = functionObject(useRootDispatch, {
  view: functionObject(useViewDispatch, {
    unconnected: useUnconnectedViewDispatch,
    connected: functionObject(useConnectedViewDispatch, {
      perlinFields: useDefRulesPerlinFieldsDispatch,
      generatorProgram: useDefRulesGeneratorProgramDispatch,
    }),
  }),
});
