import { useDispatch, useSelector, useStore } from "react-redux";

import RootState from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import UnconnectedViewState, { UnconnectedViewAction } from "../state/view/unconnected_view";
import ConnectedViewState, { ConnectedViewAction } from "../state/view/connected_view";
import { PerlinFieldsAction } from "../state/view/define_rules/perlin_fields";
import { GeneratorProgramAction } from "../state/view/define_rules/generator_program";

import { RootDispatch, RootStore, StateChangeListener, subscribeToChange } from "./root";
import { functionObject } from "../util/function_object";
import DefineRulesViewState, { DefineRulesAction } from "../state/view/define_rules";
import { useEffect } from "react";
import TerrainGenerationViewState, { TerrainGenerationAction } from "../state/view/define_rules/terrain_generation";

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

function useDefineRulesViewDispatch() {
  const connectedViewDispatch = useConnectedViewDispatch();
  return (defRulesAction: DefineRulesAction) => {
    connectedViewDispatch(
      ConnectedViewState.action.defineRules(defRulesAction)
    );
  }
}

function useDefineRulesTerrainGenerationDispatch() {
  const defRulesViewDispatch = useDefineRulesViewDispatch();
  return (terrainGenerationAction: TerrainGenerationAction) => {
    defRulesViewDispatch(
      DefineRulesViewState.action.terrainGeneration(terrainGenerationAction)
    );
  }
}

function useDefineRulesPerlinFieldsDispatch() {
  const defRulesTerrainGenerationDispatch = useDefineRulesTerrainGenerationDispatch();
  return (perlinFieldsAction: PerlinFieldsAction) => {
    defRulesTerrainGenerationDispatch(
      TerrainGenerationViewState.action.perlinFields(perlinFieldsAction)
    );
  }
}

function useDefineRulesGeneratorProgramDispatch() {
  const defRulesTerrainGenerationDispatch = useDefineRulesTerrainGenerationDispatch();
  return (generatorProgramAction: GeneratorProgramAction) => {
    defRulesTerrainGenerationDispatch(
      TerrainGenerationViewState.action.generatorProgram(generatorProgramAction)
    );
  }
}

export const useAppDispatch = functionObject(useRootDispatch, {
  view: functionObject(useViewDispatch, {
    unconnected: useUnconnectedViewDispatch,
    connected: functionObject(useConnectedViewDispatch, {
      defRules: functionObject(useDefineRulesViewDispatch, {
        terrainGeneration: functionObject(useDefineRulesTerrainGenerationDispatch, {
          perlinFields: useDefineRulesPerlinFieldsDispatch,
          generatorProgram: useDefineRulesGeneratorProgramDispatch,
        }),
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
  });
}

function useConnectedViewListener(
  onConnectedViewStateChange: StateChangeListener<ConnectedViewState>,
) {
  useViewListener((newValue, oldValue) => {
    if (newValue.connected !== oldValue.connected) {
      return onConnectedViewStateChange(newValue.connected, oldValue.connected);
    }
  });
}

function useUnconnectedViewListener(
  onUnconnectedViewStateChange: StateChangeListener<UnconnectedViewState>,
) {
  useViewListener((newValue, oldValue) => {
    if (newValue.unconnected !== oldValue.unconnected) {
      return onUnconnectedViewStateChange(
        newValue.unconnected,
        oldValue.unconnected
      );
    }
  });
}

function useDefineRulesViewListener(
  onDefineRulesViewStateChange: StateChangeListener<DefineRulesViewState|null>,
) {
  useConnectedViewListener((newValue, oldValue) => {
    if (newValue.defineRules !== oldValue.defineRules) {
      return onDefineRulesViewStateChange(newValue.defineRules, oldValue.defineRules);
    }
  });
}

export const useAppListener = functionObject(useRootListener, {
  view: functionObject(useViewListener, {
    connected: functionObject(useConnectedViewListener, {
      defineRules: useDefineRulesViewListener,
    }),
    unconnected: useUnconnectedViewListener,
  }),
});
