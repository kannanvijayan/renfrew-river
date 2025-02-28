import { Box, Typography } from "@mui/material";

import SessionState from "../../state/session";
import SecondStageFrame from "../common/SecondStageFrame";
import { RulesetEntry } from "renfrew-river-protocol-client";
import ConnectedViewState, { ConnectedViewMode } from "../../state/view/connected_view";
import { useAppDispatch } from "../../store/hooks";
import Session from "../../session/session";

export default function PickRulesetToEdit(props: {
  sessionState: SessionState,
}) {
  const { sessionState } = props;

  const dispatchConnected = useAppDispatch.view.connected();

  const onBackClicked = () => {
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.MAIN_MENU
    ));
  };

  const onRulesetClicked = async (name: string) => {
    const session = Session.getInstance();
    await session.defineRules.enter();
    await session.defineRules.loadRules(name);
    await session.defineRules.view.syncRecvRulesetInput();
    dispatchConnected(ConnectedViewState.action.setViewMode(
      ConnectedViewMode.DEFINE_RULES
    ));
  };

  return (
    <SecondStageFrame title="Edit Ruleset" onBackClicked={onBackClicked}>
      <Box display="flex" flexDirection="column" overflow="scroll"
        width="100%" height="100%" margin="0" paddingBottom="1rem" sx={{
          backgroundColor: "secondary.dark",
          borderRadius: "0 0 2.5rem 2.5rem",
        }}>
      {
        sessionState.rulesetList?.map((ruleset, index) => (
          <Entry key={index} index={index} ruleset={ruleset}
              onClick={onRulesetClicked}/>
        ))
      }
      </Box>
    </SecondStageFrame>
  )
}

function Entry(props: {
  index: number,
  ruleset: RulesetEntry,
  onClick: (name: string) => void,
}) {
  const { index, ruleset, onClick } = props;
  return (
    <Box key={index} display="flex" flexDirection="column" margin="1rem"
        onClick={() => onClick(ruleset.name)}
        sx={{ "&:hover": {
          textShadow: "0 0 0.5rem #db7",
          cursor: "pointer",
        } }}>
      <Typography key={index} variant="h3" color={"secondary.contrastText"}
          textAlign={"left"}>
        {ruleset.name}
      </Typography>
      {
        ruleset.description ?
            (
              <Typography variant="h4" color={"secondary.contrastText"}
                  textAlign="left">
                {ruleset.description}
              </Typography>
            )
        : undefined
      }
    </Box>
  );
}
