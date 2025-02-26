import { Box, Input, Typography } from "@mui/material";
import EditorBox from "./EditorBox";
import { useAppDispatch } from "../../store/hooks";
import { DefineRulesPerlinField } from "../../state/view/define_rules/ruleset";
import PerlinFieldsViewState from "../../state/view/define_rules/perlin_fields";
import DefineRulesViewState from "../../state/view/define_rules";
import ValidationErrors from "./ValidationErrors";

const useDefineRulesDispatch = useAppDispatch.view.connected.defRules;
const usePerlinFieldsDispatch =
  useDefineRulesDispatch.terrainGeneration.perlinFields;

export default function PerlinEdit(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  const validation = viewState.validation?.terrainGen?.perlin;
  const seedErrors = validation?.seed || [];
  const octavesErrors = validation?.octaves || [];
  const frequencyErrors = validation?.frequency || [];
  const amplitudeErrors = validation?.amplitude || [];
  const outregErrors = validation?.register || [];
  return (
    <EditorBox title="Perlin Rules">
      <DefineRulsetPerlinSeedField viewState={viewState} errors={seedErrors} />
      <DefineRulesetPerlinOctavesField viewState={viewState} errors={octavesErrors} />
      <DefineRulesetPerlinFrequencyField viewState={viewState} errors={frequencyErrors} />
      <DefineRulesetPerlinAmplitudeField viewState={viewState} errors={amplitudeErrors} />
      <DefineRulesetPerlinOutregField viewState={viewState} errors={outregErrors} />
    </EditorBox>
  );
}

function DefineRulsetPerlinSeedField(props: {
  viewState: DefineRulesViewState,
  errors: string[],
}) {
  const { viewState, errors } = props;
  const dispatchPerlinFields = usePerlinFieldsDispatch();
  const dispatchDefineRules =  useDefineRulesDispatch();
  const SEED = DefineRulesPerlinField.SEED;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setSeedInput(value));
  };
  const onClick = () => {
    dispatchDefineRules(DefineRulesViewState.action.setEntrySelection(SEED));
  };
  const selected = viewState.entrySelection === SEED;
  const value = viewState.terrainGeneration.perlinFields.seed;
  return (
    <DefineRulesetInputField label="Seed"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} errors={errors} />
  );
}

function DefineRulesetPerlinOctavesField(props: {
  viewState: DefineRulesViewState,
  errors: string[],
}) {
  const { viewState, errors } = props;
  const dispatchPerlinFields = usePerlinFieldsDispatch();
  const dispatchDefineRules =  useDefineRulesDispatch();
  const OCTAVES = DefineRulesPerlinField.OCTAVES;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setOctavesInput(value));
  };
  const onClick = () => {
    dispatchDefineRules(DefineRulesViewState.action.setEntrySelection(OCTAVES));
  };
  const selected = viewState.entrySelection === OCTAVES;
  const value = viewState.terrainGeneration.perlinFields.octaves;
  return (
    <DefineRulesetInputField label="Octaves"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} errors={errors} />
  );
}

function DefineRulesetPerlinFrequencyField(props: {
  viewState: DefineRulesViewState,
  errors: string[],
}) {
  const { viewState, errors } = props;
  const dispatchPerlinFields = usePerlinFieldsDispatch();
  const dispatchDefineRules = useDefineRulesDispatch();
  const FREQUENCY = DefineRulesPerlinField.FREQUENCY;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setFrequencyInput(value));
  };
  const onClick = () => {
    dispatchDefineRules(DefineRulesViewState.action.setEntrySelection(FREQUENCY));
  };
  const selected = viewState.entrySelection === FREQUENCY;
  const value = viewState.terrainGeneration.perlinFields.frequency
  return (
    <DefineRulesetInputField label="Frequency"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} errors={errors} />
  );
}

function DefineRulesetPerlinAmplitudeField(props: {
  viewState: DefineRulesViewState,
  errors: string[],
}) {
  const { viewState, errors } = props;
  const dispatchPerlinFields = usePerlinFieldsDispatch();
  const dispatchDefineRules = useDefineRulesDispatch();
  const AMPLITUDE = DefineRulesPerlinField.AMPLITUDE;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setAmplitudeInput(value));
  };
  const onClick = () => {
    dispatchDefineRules(DefineRulesViewState.action.setEntrySelection(AMPLITUDE));
  };
  const selected = viewState.entrySelection === AMPLITUDE;
  const value = viewState.terrainGeneration.perlinFields.amplitude;
  return (
    <DefineRulesetInputField label="Amplitude"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} errors={errors} />
  );
}

function DefineRulesetPerlinOutregField(props: {
  viewState: DefineRulesViewState,
  errors: string[],
}) {
  const { viewState, errors } = props;
  const dispatchPerlinFields = usePerlinFieldsDispatch();
  const dispatchDefineRules = useDefineRulesDispatch();
  const OUTREG = DefineRulesPerlinField.OUTREG;
  const onChange = (value: string) => {
    dispatchPerlinFields(PerlinFieldsViewState.action.setOutregInput(value));
  };
  const onClick = () => {
    dispatchDefineRules(DefineRulesViewState.action.setEntrySelection(OUTREG));
  };
  const selected = viewState.entrySelection === OUTREG;
  const value = viewState.terrainGeneration.perlinFields.register;
  return (
    <DefineRulesetInputField label="Outreg"
        onChange={onChange} onClick={onClick}
        selected={selected} value={value} errors={errors} />
  );
}

function DefineRulesetInputField(props: {
  label: string,
  onChange: (value: string) => void,
  onClick: () => void,
  value: string,
  selected?: boolean,
  errors?: string[],
}) {
  const { label, onChange, onClick, value, selected } = props;
  const borderColor = selected ? "#caa" : "#622";
  const borderStyle = selected ? "solid" : "dotted";
  const errors = props.errors || [];
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
        width="8rem" textAlign={"right"}>
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
      <span style={{float: "left", padding: "0", margin: "0"}}>
        <FieldValidation errors={errors} />
      </span>
    </Box>
  )
}

function FieldValidation(props: {
  errors: string[],
}) {
  const { errors } = props;
  const enabled = errors.length > 0;
  const exclaimSx = {
    fontSize: "1.5rem",
    margin: "0 0 0 0",
    padding: "0 0 0 1rem",
    position: "absolute",
    display: "block",
  };

  if (!enabled) {
    return;
  }
  return <ValidationErrors errors={errors} exclaimSx={exclaimSx} />
}
