import { Box, Input, Typography } from "@mui/material";
import DefineRulesetEditorBox from "./DefineRulesetEditorBox";
import { useAppDispatch } from "../../store/hooks";
import { DefRulesPerlinField } from "../../state/view/def_rules/ruleset";
import PerlinFieldsViewState from "../../state/view/def_rules/perlin_fields";
import DefRulesViewState from "../../state/view/def_rules";

export default function DefineRulesetPerlinEdit(props: {
  viewState: DefRulesViewState,
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
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  const dispatchPerlinFields =
    useAppDispatch.view.connected.defRules.perlinFields();
  const dispatchDefRules = useAppDispatch.view.connected.defRules();
  const SEED = DefRulesPerlinField.SEED;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setSeedInput(value));
  };
  const onClick = () => {
    dispatchDefRules(DefRulesViewState.action.setEntrySelection(SEED));
  };
  const selected = viewState.entrySelection === SEED;
  const value = viewState.perlinFields.seed;
  return (
    <DefineRulesetInputField label="Seed"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinOctavesField(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  const dispatchPerlinFields =
    useAppDispatch.view.connected.defRules.perlinFields();
  const dispatchDefRules = useAppDispatch.view.connected.defRules();
  const OCTAVES = DefRulesPerlinField.OCTAVES;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setOctavesInput(value));
  };
  const onClick = () => {
    dispatchDefRules(DefRulesViewState.action.setEntrySelection(OCTAVES));
  };
  const selected = viewState.entrySelection === OCTAVES;
  const value = viewState.perlinFields.octaves;
  return (
    <DefineRulesetInputField label="Octaves"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinFrequencyField(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  const dispatchPerlinFields =
    useAppDispatch.view.connected.defRules.perlinFields();
  const dispatchDefRules = useAppDispatch.view.connected.defRules();
  const FREQUENCY = DefRulesPerlinField.FREQUENCY;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setFrequencyInput(value));
  };
  const onClick = () => {
    dispatchDefRules(DefRulesViewState.action.setEntrySelection(FREQUENCY));
  };
  const selected = viewState.entrySelection === FREQUENCY;
  const value = viewState.perlinFields.frequency
  return (
    <DefineRulesetInputField label="Frequency"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinAmplitudeField(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  const dispatchPerlinFields =
    useAppDispatch.view.connected.defRules.perlinFields();
  const dispatchDefRules = useAppDispatch.view.connected.defRules();
  const AMPLITUDE = DefRulesPerlinField.AMPLITUDE;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setAmplitudeInput(value));
  };
  const onClick = () => {
    dispatchDefRules(DefRulesViewState.action.setEntrySelection(AMPLITUDE));
  };
  const selected = viewState.entrySelection === AMPLITUDE;
  const value = viewState.perlinFields.amplitude;
  return (
    <DefineRulesetInputField label="Amplitude"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} />
  );
}

function DefineRulesetPerlinOutregField(props: {
  viewState: DefRulesViewState,
}) {
  const { viewState } = props;
  const dispatchPerlinFields =
    useAppDispatch.view.connected.defRules.perlinFields();
  const dispatchDefRules = useAppDispatch.view.connected.defRules();
  const OUTREG = DefRulesPerlinField.OUTREG;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setOutregInput(value));
  };
  const onClick = () => {
    dispatchDefRules(DefRulesViewState.action.setEntrySelection(OUTREG));
  };
  const selected = viewState.entrySelection === OUTREG;
  const value = viewState.perlinFields.register;
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
