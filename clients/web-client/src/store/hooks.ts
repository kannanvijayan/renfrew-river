import { useDispatch, useSelector, useStore } from "react-redux";

import RootState from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import { UnconnectedViewAction } from "../state/view/unconnected_view";
import ConnectedViewState, { ConnectedViewAction } from "../state/view/connected_view";
import { PerlinFieldsAction } from "../state/view/def_rules/perlin_fields";
import { GeneratorProgramAction } from "../state/view/def_rules/generator_program";

import type { RootDispatch, RootStore } from "./root";
import { functionObject } from "../util/function_object";
import DefRulesViewState, { DefRulesAction } from "../state/view/def_rules";

export const useRootDispatch = useDispatch.withTypes<RootDispatch>();
export const useRootSelector = useSelector.withTypes<RootState>();
export const useRootStore = useStore.withTypes<RootStore>();

function useViewDispatch() {
  const dispatch = useRootDispatch();
  return (viewAction: ViewAction) => {
    dispatch(RootState.action.view(viewAction));
  }
}

function useUnconnectedViewDispatch() {
  const dispatch = useRootDispatch();
  return (unconnectedViewAction: UnconnectedViewAction) => {
    dispatch(RootState.action.view(
      ViewState.action.unconnected(unconnectedViewAction)
    ));
  }
}

function useConnectedViewDispatch() {
  const dispatch = useRootDispatch();
  return (connectedViewAction: ConnectedViewAction) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(connectedViewAction)
    ));
  }
}

function useDefRulesViewDispatch() {
  const connectedViewDispatch = useConnectedViewDispatch();
  return (defRulesAction: DefRulesAction) => {
    connectedViewDispatch(
      ConnectedViewState.action.defRules(defRulesAction)
    );
  }
}

function useDefRulesPerlinFieldsDispatch() {
  const defRulesViewDispatch = useDefRulesViewDispatch();
  return (perlinFieldsAction: PerlinFieldsAction) => {
    defRulesViewDispatch(
      DefRulesViewState.action.perlinFields(perlinFieldsAction)
    );
  }
}

function useDefRulesGeneratorProgramDispatch() {
  const defRulesViewDispatch = useDefRulesViewDispatch();
  return (generatorProgramAction: GeneratorProgramAction) => {
    defRulesViewDispatch(
      DefRulesViewState.action.generatorProgram(generatorProgramAction)
    );
  }
}

export const useAppDispatch = functionObject(useRootDispatch, {
  view: functionObject(useViewDispatch, {
    unconnected: useUnconnectedViewDispatch,
    connected: functionObject(useConnectedViewDispatch, {
      defRules: functionObject(useDefRulesViewDispatch, {
        perlinFields: useDefRulesPerlinFieldsDispatch,
        generatorProgram: useDefRulesGeneratorProgramDispatch,
      }),
    }),
  }),
});
