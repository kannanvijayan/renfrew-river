import { Button, Container, Divider, styled, Typography } from "@mui/material";

import "./MainMenu.css";
import { useAppDispatch } from "../../store/hooks";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import DefineRulesViewState from "../../state/view/define_rules";
import Session from "../../session/session";
import SessionState from "../../state/session";
import { RulesetEntry } from "renfrew-river-protocol-client";

export default function MainMenu(props:{
  sessionState: SessionState,
}) {
  const { sessionState } = props;
  return (
    <Container className="MainMenu" sx={{ backgroundColor: "secondary.dark" }}>
      <MainMenuTitle />
      <Separator />
      <DefineRulesetButton />
      <EditRulesetButton rulesets={sessionState.rulesetList || []} />
      <Separator />
      <CreateWorldButton />
      <LoadWorldButton />
      <Separator />
      <NewGameButton />
      <LoadGameButton />
    </Container>
  )
}

function Separator() {
  return (
    <Divider sx={{
      height: "0.25rem", width: "50%",
      borderRadius: "0.25rem",
      backgroundColor: "secondary.main",
      margin: "2rem 0 2rem 0",
    }} />
  );
}

function MainMenuTitle() {
  return (
    <>
      <Typography className="MainMenuTitle" variant="h1"
        color={"secondary.contrastText"}>
        Renfrew River
      </Typography>
      <Typography className="MainMenuSubtitle" variant="h4"
        color={"secondary.contrastText"}>
        A Simulation Game Engine
      </Typography>
    </>
  )
}

function DefineRulesetButton() {
  const dispatchConnected = useAppDispatch.view.connected();
  const onClick = async () => {
    const session = Session.getInstance();
    await session.defineRules.enter();
    session.defineRules.view.bumpValidationTimeout();
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.DEFINE_RULES
    ));
    dispatchConnected(ConnectedViewState.action.setDefineRules(
      DefineRulesViewState.initialState
    ));
  };

  return (
    <MainMenuButton label="Define Ruleset" onClick={onClick} />
  );
}

function EditRulesetButton(props: {
  rulesets: RulesetEntry[],
}) {
  const { rulesets } = props;
  const dispatchConnected = useAppDispatch.view.connected();
  const onClick = async () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.PICK_RULESET_TO_EDIT
    ));
  };
  const disabled = rulesets.length === 0;
  return (
    <MainMenuButton label="Edit Ruleset" onClick={onClick} disabled={disabled} />
  );
}

function CreateWorldButton() {
  return (
    <MainMenuButton label="Create World" onClick={() => {}} disabled />
  );
}

function LoadWorldButton() {
  return (
    <MainMenuButton label="Load World" onClick={() => {}} disabled />
  );
}

function NewGameButton() {
  return (
    <MainMenuButton label="New Game" onClick={() => {}} disabled />
  );
}

function LoadGameButton() {
  return (
    <MainMenuButton label="Load Game" onClick={() => {}} disabled />
  );
}

const StyledButton = styled(Button)({
  borderRadius: "1.5rem",
  border: "0.5em solid #a66",
  textTransform: "none",
  padding: "1rem",
  boxShadow: "0.4rem 0.4rem 1rem #200808",
  margin: "1rem 8rem 1rem 8rem",
  width: "100%",
  "&:hover": {
    boxShadow: "0rem 0rem 1rem #d66",
  },
  "&:disabled": {
    border: "0.5em solid #b88",
    backgroundColor: "#a88",
    color: "#866"
  }
});

function MainMenuButton(props: {
  label: string,
  disabled?: boolean,
  onClick: () => void,
}) {
  const { label, disabled, onClick } = props;
  return (
    <StyledButton className="MainMenuButton" variant="contained" onClick={onClick}
      disabled={disabled}>
      <Typography className="MainMenuButtonText" variant="h2">
        {label}
      </Typography>
    </StyledButton>
  );
}
