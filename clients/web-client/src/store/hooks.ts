import { useDispatch, useSelector, useStore } from "react-redux";

import RootState from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import UnconnectedViewState, { UnconnectedViewAction } from "../state/view/unconnected_view";
import ConnectedViewState, { ConnectedViewAction } from "../state/view/connected_view";
import { PerlinFieldsAction } from "../state/view/def_rules/perlin_fields";
import { GeneratorProgramAction } from "../state/view/def_rules/generator_program";

import { RootDispatch, RootStore, StateChangeListener, subscribeToChange } from "./root";
import { functionObject } from "../util/function_object";
import DefRulesViewState, { DefRulesAction } from "../state/view/def_rules";
import { useEffect } from "react";

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


function useRootListener(onRootStateChange: StateChangeListener<RootState>) {
  useEffect(() => {
    return subscribeToChange({
      selector: (state) => state,
      equals: (a, b) => a === b,
      onChange: onRootStateChange,
    });
  });
}

function useViewListener(onViewStateChange: StateChangeListener<ViewState>) {
  useRootListener((newValue, oldValue) => {
    if (newValue.view !== oldValue.view) {
      return onViewStateChange(newValue.view, oldValue.view);
    }
    return () => {};
  });
}

function useConnectedViewListener(
  onConnectedViewStateChange: (
    newValue: ConnectedViewState,
    oldValue: ConnectedViewState
  ) => void
) {
  useViewListener((newValue, oldValue) => {
    if (newValue.connected !== oldValue.connected) {
      onConnectedViewStateChange(newValue.connected, oldValue.connected);
    }
  });
}

function useUnconnectedViewListener(
  onUnconnectedViewStateChange: (
    newValue: UnconnectedViewState,
    oldValue: UnconnectedViewState
  ) => void
) {
  useViewListener((newValue, oldValue) => {
    if (newValue.unconnected !== oldValue.unconnected) {
      onUnconnectedViewStateChange(newValue.unconnected, oldValue.unconnected);
    }
  });
}

function useDefRulesViewListener(
  onDefRulesViewStateChange: (
    newValue: DefRulesViewState | null,
    oldValue: DefRulesViewState | null,
  ) => void
) {
  useConnectedViewListener((newValue, oldValue) => {
    if (newValue.defRules !== oldValue.defRules) {
      onDefRulesViewStateChange(newValue.defRules, oldValue.defRules);
    }
  });
}

export const useAppListener = functionObject(useRootListener, {
  view: functionObject(useViewListener, {
    connected: functionObject(useConnectedViewListener, {
      defRules: useDefRulesViewListener,
    }),
    unconnected: useUnconnectedViewListener,
  }),
});
