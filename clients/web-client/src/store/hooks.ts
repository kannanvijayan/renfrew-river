import { useEffect } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import { functionObject } from "../util/function_object";

import RootState from "../state/root";
import ViewState, { ViewAction } from "../state/view";
import UnconnectedViewState, { UnconnectedViewAction }
  from "../state/view/unconnected_view";

import ConnectedViewState, { ConnectedViewAction }
  from "../state/view/connected_view";

import CreateWorldViewState, { CreateWorldAction }
  from "../state/view/create_world/create_world";

import DefineRulesViewState, { DefineRulesAction }
  from "../state/view/define_rules/define_rules";

import { GeneratorProgramAction }
  from "../state/view/define_rules/generator_program";

import { PerlinFieldsAction } from "../state/view/define_rules/perlin_fields";

import TerrainGenerationViewState, { TerrainGenerationAction }
  from "../state/view/define_rules/terrain_generation";

import { RootDispatch, RootStore } from "./root";
import { StateChangeListener, subscribeToChange } from "./subscribe";
import Application from "../application";

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
  const dispatch = useViewDispatch();
  return (unconnectedViewAction: UnconnectedViewAction) => {
    dispatch(ViewState.action.unconnected(unconnectedViewAction));
  }
}

function useConnectedViewDispatch() {
  const dispatch = useViewDispatch();
  return (connectedViewAction: ConnectedViewAction) => {
    dispatch(ViewState.action.connected(connectedViewAction));
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

function useCreateWorldViewDispatch() {
  const connectedViewDispatch = useConnectedViewDispatch();
  return (createWorldAction: CreateWorldAction) => {
    connectedViewDispatch(
      ConnectedViewState.action.createWorld(createWorldAction)
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
      createWorld: useCreateWorldViewDispatch,
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

function useCreateWorldViewListener(
  onCreateWorldViewStateChange: StateChangeListener<CreateWorldViewState|null>,
) {
  useConnectedViewListener((newValue, oldValue) => {
    if (newValue.createWorld !== oldValue.createWorld) {
      return onCreateWorldViewStateChange(newValue.createWorld, oldValue.createWorld);
    }
  });
}

function createWorldWatchDescriptorChange() {
  useAppListener.view.connected.createWorld((newCreateWorld, oldCreateWorld) => {
    if (newCreateWorld === null || !("SpecifyDescriptor" in newCreateWorld)) {
      return;
    }
    const newDescriptor = newCreateWorld.SpecifyDescriptor.descriptor;
    if (
      oldCreateWorld == null ||
      !("SpecifyDescriptor" in oldCreateWorld) ||
      newDescriptor !== oldCreateWorld.SpecifyDescriptor.descriptor
    ) {
      const session = Application.getInstance().getSession();
      session.createWorld.view.bumpValidationTimeout();
    }
  });
}

export const useAppListener = functionObject(useRootListener, {
  view: functionObject(useViewListener, {
    connected: functionObject(useConnectedViewListener, {
      defineRules: useDefineRulesViewListener,
      createWorld: functionObject(useCreateWorldViewListener, {
        watchDescriptorChange: createWorldWatchDescriptorChange,
      }),
    }),
    unconnected: useUnconnectedViewListener,
  }),
});
