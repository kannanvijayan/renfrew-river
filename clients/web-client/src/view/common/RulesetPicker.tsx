import { Box, Typography } from "@mui/material";
import SecondStageFrame from "../common/SecondStageFrame";
import { RulesetEntry } from "renfrew-river-protocol-client";

export default function RulesetPicker(props: {
  rulesetList: RulesetEntry[],
  title: string,
  onBackClicked: () => void,
  onRulesetClicked: (name: string) => void,
}) {
  const { rulesetList, title, onBackClicked, onRulesetClicked } = props;

  return (
    <SecondStageFrame title={title} onBackClicked={onBackClicked}>
      <Box display="flex" flexDirection="column" overflow="scroll"
        width="100%" height="100%" margin="0" paddingBottom="1rem" sx={{
          backgroundColor: "secondary.dark",
          borderRadius: "0 0 2.5rem 2.5rem",
        }}>
      {
        rulesetList.map((ruleset, index) => (
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
        sx={{
          borderBottom: "0.2rem dotted #ca6",
          "&:last-child": {
            borderBottom: "0.2rem solid #ca6",
          },
          "&:hover": {
            textShadow: "0 0 0.5rem #db7",
            cursor: "pointer",
          },
        }}>
      <Typography key={index} variant="h3" color={"secondary.contrastText"}
          textAlign={"left"} sx={{ paddingBottom: "0.5rem" }}>
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
