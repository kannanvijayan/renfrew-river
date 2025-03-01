import { Box, Input, Typography } from "@mui/material";
import EditorBox from "./EditorBox";
import { useAppDispatch } from "../../store/hooks";
import { DefineRulesPerlinField } from "../../state/view/define_rules/ruleset";
import PerlinFieldsViewState from "../../state/view/define_rules/perlin_fields";
import DefineRulesViewState from "../../state/view/define_rules/define_rules";
import ValidationErrors from "../common/ValidationErrors";

const useDefineRulesDispatch = useAppDispatch.view.connected.defRules;
const usePerlinFieldsDispatch =
  useDefineRulesDispatch.terrainGeneration.perlinFields;

export default function PerlinEdit(props: {
  viewState: DefineRulesViewState,
}) {
  const { viewState } = props;
  const validation = viewState.validation?.terrainGen?.perlin;
  const outregErrors = validation?.register || [];
  return (
    <EditorBox title="Perlin Rules">
      <DefineRulesetPerlinOutregField viewState={viewState} errors={outregErrors} />
    </EditorBox>
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
