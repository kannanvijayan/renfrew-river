import { Box, Input, Typography } from "@mui/material";
import ConnectedViewState from "../../state/view/connected_view";
import DefineRulesetEditorBox from "./DefineRulesetEditorBox";
import { useRootDispatch } from "../../store/hooks";
import RootState from "../../state/root";
import ViewState from "../../state/view";
import { DefRulesPerlinField } from "../../state/view/def_rules";
import PerlinFieldsViewState from "../../state/view/perlin_fields";

export default function DefineRulesetPerlinEdit(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  return (
    <DefineRulesetEditorBox title="Perlin Rules">
      <DefineRulsetPerlinSeedField viewState={viewState} />
      <DefineRulesetPerlinOctavesField viewState={viewState} />
      <DefineRulesetPerlinFrequencyField viewState={viewState} />
      <DefineRulesetPerlinAmplitudeField viewState={viewState} />
      <DefineRulesetPerlinOutregField viewState={viewState} />
    </DefineRulesetEditorBox>
  );
}

function DefineRulsetPerlinSeedField(props: {
  viewState: ConnectedViewState,
}) {
  const dispatch = useRootDispatch();
  const SEED = DefRulesPerlinField.SEED;
  const onChange = (value: string) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.perlinFields(
          PerlinFieldsViewState.action.setSeedInput(value)
        )
      )
    ));
  };
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(SEED)
      )
    ));
  };
  const selected = props.viewState.defRulesEntrySelection === SEED;
  const value = props.viewState.perlinFields.seedInput;
  return (
    <DefineRulesetInputField label="Seed"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinOctavesField(props: {
  viewState: ConnectedViewState,
}) {
  const dispatch = useRootDispatch();
  const OCTAVES = DefRulesPerlinField.OCTAVES;
  const onChange = (value: string) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.perlinFields(
          PerlinFieldsViewState.action.setOctavesInput(value)
        )
      )
    ));
  };
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(OCTAVES)
      )
    ));
  };
  const selected = props.viewState.defRulesEntrySelection === OCTAVES;
  const value = props.viewState.perlinFields.octavesInput;
  return (
    <DefineRulesetInputField label="Octaves"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinFrequencyField(props: {
  viewState: ConnectedViewState,
}) {
  const { viewState } = props;
  const dispatch = useRootDispatch();
  const FREQUENCY = DefRulesPerlinField.FREQUENCY;
  const onChange = (value: string) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.perlinFields(
          PerlinFieldsViewState.action.setFrequencyInput(value)
        )
      )
    ));
  };
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(FREQUENCY)
      )
    ));
  };
  const selected = viewState.defRulesEntrySelection === FREQUENCY;
  const value = viewState.perlinFields.frequencyInput
  return (
    <DefineRulesetInputField label="Frequency"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinAmplitudeField(props: {
  viewState: ConnectedViewState,
}) {
  const dispatch = useRootDispatch();
  const AMPLITUDE = DefRulesPerlinField.AMPLITUDE;
  const onChange = (value: string) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.perlinFields(
          PerlinFieldsViewState.action.setAmplitudeInput(value)
        )
      )
    ));
  };
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(AMPLITUDE)
      )
    ));
  };
  const selected = props.viewState.defRulesEntrySelection === AMPLITUDE;
  const value = props.viewState.perlinFields.amplitudeInput;
  return (
    <DefineRulesetInputField label="Amplitude"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinOutregField(props: {
  viewState: ConnectedViewState,
}) {
  const dispatch = useRootDispatch();
  const OUTREG = DefRulesPerlinField.OUTREG;
  const onChange = (value: string) => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.perlinFields(
          PerlinFieldsViewState.action.setOutregInput(value)
        )
      )
    ));
  };
  const onClick = () => {
    dispatch(RootState.action.view(
      ViewState.action.connected(
        ConnectedViewState.action.setDefRulesEntrySelection(OUTREG)
      )
    ));
  };
  const selected = props.viewState.defRulesEntrySelection === OUTREG;
  const value = props.viewState.perlinFields.outregInput;
  return (
    <DefineRulesetInputField label="Outreg"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetInputField(props: {
  label: string,
  onChange: (value: string) => void,
  onClick: () => void,
  value: string,
  selected?: boolean,
}) {
  const { label, onChange, onClick, value, selected } = props;
  const borderColor = selected ? "#caa" : "#622";
  const borderStyle = selected ? "solid" : "dotted";
  return (
    <Box display="flex" flexDirection="row"
      margin="2rem 1rem 1rem 1rem" padding="1rem" width="95%" textAlign={"left"}
      onClick={onClick}
      sx={{
        borderColor,
        borderWidth: "2px",
        borderStyle,
        borderRadius: "1rem"
      }}
      >
      <Typography variant="h5" color={"primary.dark"}
        margin="0 1rem 0 0" padding="0" fontWeight={700}
        width="8rem" textAlign={"right"}
        >
        {label}
      </Typography>
      <Input onChange={(e) => onChange(e.target.value)}
        value={value}
        sx={{
          backgroundColor: "secondary.light",
          borderRadius: "0.5rem",
          height: "2rem",
          fontSize: "1.5rem",
          padding: "0 0.5rem",
          margin: 0,
        }}
        />
    </Box>
  )
}
